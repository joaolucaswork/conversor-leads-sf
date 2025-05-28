# Calendar event service logic
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
import logging

from .salesforce_calendar_service import SalesforceCalendarService
from ..models.event import CalendarEvent, EventFilter, EventDateRange
from ..schemas.event_schemas import (
    EventsQueryRequest,
    EventCreateRequest,
    EventUpdateRequest,
    TaskCreateRequest,
    TaskUpdateRequest,
    EventResponse,
    EventsResponse,
    EventCreateResponse,
    EventUpdateResponse,
    EventDeleteResponse,
    CalendarStatsResponse,
    EventSummary
)

logger = logging.getLogger(__name__)


class CalendarEventService:
    """Service for calendar event operations"""

    def __init__(self, access_token: str, instance_url: str):
        """
        Initialize calendar event service

        Args:
            access_token: Salesforce access token
            instance_url: Salesforce instance URL
        """
        self.salesforce_service = SalesforceCalendarService(access_token, instance_url)

    async def get_events(self, query: EventsQueryRequest) -> EventsResponse:
        """
        Get calendar events based on query parameters

        Args:
            query: Query parameters for filtering events

        Returns:
            EventsResponse with events and metadata
        """
        try:
            # Create event filter from query
            event_filter = EventFilter(
                event_types=query.event_types,
                statuses=query.statuses,
                owner_ids=query.owner_ids,
                account_ids=query.account_ids,
                include_tasks=query.include_tasks,
                include_events=query.include_events,
                include_recurring=query.include_recurring,
                start_date=query.start_date,
                end_date=query.end_date,
                search_term=query.search_term,
                limit=query.limit,
                offset=query.offset
            )

            # Fetch events from Salesforce
            events = await self.salesforce_service.get_events(
                query.start_date,
                query.end_date,
                event_filter
            )

            # Convert to response format
            event_responses = [self._convert_to_event_response(event) for event in events]

            # Calculate pagination info
            total_count = len(event_responses)
            has_more = total_count >= (query.limit or 1000)
            next_offset = (query.offset or 0) + len(event_responses) if has_more else None

            return EventsResponse(
                events=event_responses,
                total_count=total_count,
                has_more=has_more,
                next_offset=next_offset
            )

        except Exception as e:
            logger.error(f"Error getting calendar events: {e}")
            raise

    async def get_event_by_id(self, event_id: str) -> Optional[EventResponse]:
        """
        Get a single event by ID

        Args:
            event_id: Calendar event ID (format: event_<sf_id> or task_<sf_id>)

        Returns:
            EventResponse or None if not found
        """
        try:
            # Parse event ID to determine type and Salesforce ID
            if event_id.startswith('event_'):
                sf_id = event_id[6:]  # Remove 'event_' prefix
                event_type = 'Event'
            elif event_id.startswith('task_'):
                sf_id = event_id[5:]   # Remove 'task_' prefix
                event_type = 'Task'
            else:
                logger.warning(f"Invalid event ID format: {event_id}")
                return None

            # For now, we'll need to fetch events in a date range to find the specific one
            # In a production system, you might want to implement direct Salesforce queries by ID
            today = date.today()
            start_date = today - timedelta(days=365)  # Look back 1 year
            end_date = today + timedelta(days=365)    # Look forward 1 year

            events = await self.salesforce_service.get_events(start_date, end_date)

            # Find the specific event
            for event in events:
                if event.id == event_id:
                    return self._convert_to_event_response(event)

            return None

        except Exception as e:
            logger.error(f"Error getting event by ID {event_id}: {e}")
            raise

    async def create_event(self, request: EventCreateRequest) -> EventCreateResponse:
        """
        Create a new event in Salesforce

        Args:
            request: Event creation request

        Returns:
            EventCreateResponse with created event info
        """
        try:
            logger.info(f"Creating Salesforce event: {request.subject}")

            # Create event in Salesforce
            salesforce_event = await self.salesforce_service.create_event(request)

            if salesforce_event and salesforce_event.id:
                # Convert to calendar event for response
                calendar_event = self.salesforce_service._convert_event_to_calendar_event(salesforce_event)
                event_response = self._convert_to_event_response(calendar_event)

                logger.info(f"Successfully created Salesforce event: {salesforce_event.id}")

                return EventCreateResponse(
                    success=True,
                    event_id=calendar_event.id,
                    salesforce_id=salesforce_event.id,
                    message="Event created successfully",
                    event=event_response
                )
            else:
                logger.error("Failed to create event: No event data returned from Salesforce")
                return EventCreateResponse(
                    success=False,
                    event_id="",
                    salesforce_id="",
                    message="Failed to create event in Salesforce"
                )

        except Exception as e:
            logger.error(f"Error creating event: {e}")
            return EventCreateResponse(
                success=False,
                event_id="",
                salesforce_id="",
                message=f"Error creating event: {str(e)}"
            )

    async def update_event(self, event_id: str, request: EventUpdateRequest) -> EventUpdateResponse:
        """
        Update an existing event in Salesforce

        Args:
            event_id: Calendar event ID
            request: Event update request

        Returns:
            EventUpdateResponse with update status
        """
        try:
            logger.info(f"Updating Salesforce event: {event_id}")

            # Update event in Salesforce
            salesforce_event = await self.salesforce_service.update_event(event_id, request)

            if salesforce_event and salesforce_event.id:
                # Convert to calendar event for response
                calendar_event = self.salesforce_service._convert_event_to_calendar_event(salesforce_event)
                event_response = self._convert_to_event_response(calendar_event)

                logger.info(f"Successfully updated Salesforce event: {salesforce_event.id}")

                return EventUpdateResponse(
                    success=True,
                    message="Event updated successfully",
                    event=event_response
                )
            else:
                logger.error("Failed to update event: No event data returned from Salesforce")
                return EventUpdateResponse(
                    success=False,
                    message="Failed to update event in Salesforce"
                )

        except Exception as e:
            logger.error(f"Error updating event {event_id}: {e}")
            return EventUpdateResponse(
                success=False,
                message=f"Error updating event: {str(e)}"
            )

    async def delete_event(self, event_id: str) -> EventDeleteResponse:
        """
        Delete an event from Salesforce

        Args:
            event_id: Calendar event ID

        Returns:
            EventDeleteResponse with deletion status
        """
        try:
            logger.info(f"Deleting Salesforce event: {event_id}")

            # Delete event from Salesforce
            success = await self.salesforce_service.delete_event(event_id)

            if success:
                logger.info(f"Successfully deleted Salesforce event: {event_id}")
                return EventDeleteResponse(
                    success=True,
                    message="Event deleted successfully"
                )
            else:
                logger.error(f"Failed to delete event: {event_id}")
                return EventDeleteResponse(
                    success=False,
                    message="Failed to delete event from Salesforce"
                )

        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {e}")
            return EventDeleteResponse(
                success=False,
                message=f"Error deleting event: {str(e)}"
            )

    async def create_task(self, request: TaskCreateRequest) -> EventCreateResponse:
        """
        Create a new task in Salesforce

        Args:
            request: Task creation request

        Returns:
            EventCreateResponse with created task info
        """
        try:
            logger.info(f"Creating Salesforce task: {request.subject}")

            # Create task in Salesforce
            salesforce_task = await self.salesforce_service.create_task(request)

            if salesforce_task and salesforce_task.id:
                # Convert to calendar event for response
                calendar_event = self.salesforce_service._convert_task_to_calendar_event(salesforce_task)
                event_response = self._convert_to_event_response(calendar_event)

                logger.info(f"Successfully created Salesforce task: {salesforce_task.id}")

                return EventCreateResponse(
                    success=True,
                    event_id=calendar_event.id,
                    salesforce_id=salesforce_task.id,
                    message="Task created successfully",
                    event=event_response
                )
            else:
                logger.error("Failed to create task: No task data returned from Salesforce")
                return EventCreateResponse(
                    success=False,
                    event_id="",
                    salesforce_id="",
                    message="Failed to create task in Salesforce"
                )

        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return EventCreateResponse(
                success=False,
                event_id="",
                salesforce_id="",
                message=f"Error creating task: {str(e)}"
            )

    async def update_task(self, task_id: str, request: TaskUpdateRequest) -> EventUpdateResponse:
        """
        Update an existing task in Salesforce

        Args:
            task_id: Calendar task ID
            request: Task update request

        Returns:
            EventUpdateResponse with update status
        """
        try:
            logger.info(f"Updating Salesforce task: {task_id}")

            # Update task in Salesforce
            salesforce_task = await self.salesforce_service.update_task(task_id, request)

            if salesforce_task and salesforce_task.id:
                # Convert to calendar event for response
                calendar_event = self.salesforce_service._convert_task_to_calendar_event(salesforce_task)
                event_response = self._convert_to_event_response(calendar_event)

                logger.info(f"Successfully updated Salesforce task: {salesforce_task.id}")

                return EventUpdateResponse(
                    success=True,
                    message="Task updated successfully",
                    event=event_response
                )
            else:
                logger.error("Failed to update task: No task data returned from Salesforce")
                return EventUpdateResponse(
                    success=False,
                    message="Failed to update task in Salesforce"
                )

        except Exception as e:
            logger.error(f"Error updating task {task_id}: {e}")
            return EventUpdateResponse(
                success=False,
                message=f"Error updating task: {str(e)}"
            )

    async def get_calendar_stats(self, start_date: date, end_date: date) -> CalendarStatsResponse:
        """
        Get calendar statistics for a date range

        Args:
            start_date: Start date for statistics
            end_date: End date for statistics

        Returns:
            CalendarStatsResponse with summary statistics
        """
        try:
            # Fetch all events in the date range
            events = await self.salesforce_service.get_events(start_date, end_date)

            # Calculate summary statistics
            total_events = sum(1 for e in events if e.salesforce_type == "Event")
            total_tasks = sum(1 for e in events if e.salesforce_type == "Task")

            # Today's events
            today = date.today()
            today_events = sum(1 for e in events if e.start.date() == today)

            # This week's events
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            this_week_events = sum(1 for e in events
                                 if week_start <= e.start.date() <= week_end)

            # Upcoming events (future events)
            upcoming_events = sum(1 for e in events if e.start.date() > today)

            # Overdue tasks (tasks with due date in the past and not completed)
            overdue_tasks = sum(1 for e in events
                              if (e.salesforce_type == "Task" and
                                  e.start.date() < today and
                                  e.status not in ["completed", "closed"]))

            # Group by type
            by_type = {}
            for event in events:
                event_type = event.event_type
                by_type[event_type] = by_type.get(event_type, 0) + 1

            # Group by status
            by_status = {}
            for event in events:
                status = event.status
                by_status[status] = by_status.get(status, 0) + 1

            # Group by owner
            by_owner = {}
            for event in events:
                owner = event.owner_name or "Unknown"
                by_owner[owner] = by_owner.get(owner, 0) + 1

            summary = EventSummary(
                total_events=total_events,
                total_tasks=total_tasks,
                upcoming_events=upcoming_events,
                overdue_tasks=overdue_tasks,
                today_events=today_events,
                this_week_events=this_week_events,
                date_range={"start_date": start_date, "end_date": end_date}
            )

            return CalendarStatsResponse(
                success=True,
                summary=summary,
                by_type=by_type,
                by_status=by_status,
                by_owner=by_owner
            )

        except Exception as e:
            logger.error(f"Error getting calendar stats: {e}")
            raise

    def _convert_to_event_response(self, event: CalendarEvent) -> EventResponse:
        """Convert CalendarEvent to EventResponse"""
        return EventResponse(
            id=event.id,
            title=event.title,
            start=event.start,
            end=event.end,
            all_day=event.all_day,
            description=event.description,
            location=event.location,
            status=event.status,
            event_type=event.event_type,
            salesforce_id=event.salesforce_id,
            salesforce_type=event.salesforce_type,
            owner_name=event.owner_name,
            related_to=event.related_to,
            related_person=event.related_person,
            is_recurring=event.is_recurring,
            recurrence_rule=event.recurrence_rule,
            has_reminder=event.has_reminder,
            reminder_minutes=event.reminder_minutes,
            created_at=event.created_at,
            updated_at=event.updated_at,
            editable=event.editable
        )
