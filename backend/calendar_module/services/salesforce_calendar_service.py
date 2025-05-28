# Salesforce integration for calendar
import requests
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import quote
import logging

from ..models.event import (
    SalesforceEvent,
    SalesforceTask,
    CalendarEvent,
    EventType,
    EventStatus,
    EventFilter
)

logger = logging.getLogger(__name__)


class SalesforceCalendarService:
    """Service for interacting with Salesforce calendar data"""

    def __init__(self, access_token: str, instance_url: str):
        """
        Initialize Salesforce calendar service

        Args:
            access_token: Salesforce access token
            instance_url: Salesforce instance URL
        """
        self.access_token = access_token
        self.instance_url = instance_url.rstrip('/')
        self.api_version = "v58.0"
        self.base_url = f"{self.instance_url}/services/data/{self.api_version}"

        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    async def get_events(
        self,
        start_date: date,
        end_date: date,
        event_filter: Optional[EventFilter] = None
    ) -> List[CalendarEvent]:
        """
        Fetch events and tasks from Salesforce within date range

        Args:
            start_date: Start date for query
            end_date: End date for query
            event_filter: Optional filters to apply

        Returns:
            List of CalendarEvent objects
        """
        try:
            events = []

            # Fetch Events if requested
            if not event_filter or event_filter.include_events:
                sf_events = await self._fetch_salesforce_events(start_date, end_date, event_filter)
                events.extend([self._convert_event_to_calendar_event(event) for event in sf_events])

            # Fetch Tasks if requested
            if not event_filter or event_filter.include_tasks:
                sf_tasks = await self._fetch_salesforce_tasks(start_date, end_date, event_filter)
                events.extend([self._convert_task_to_calendar_event(task) for task in sf_tasks])

            # Sort by start date
            events.sort(key=lambda x: x.start)

            return events

        except Exception as e:
            logger.error(f"Error fetching events from Salesforce: {e}")
            raise

    async def create_event(self, request) -> Optional[SalesforceEvent]:
        """
        Create a new event in Salesforce

        Args:
            request: EventCreateRequest with event data

        Returns:
            SalesforceEvent if successful, None otherwise
        """
        try:
            from ..schemas.event_schemas import EventCreateRequest

            logger.info(f"Creating Salesforce event: {request.subject}")

            # Prepare event data for Salesforce API
            event_data = {
                "Subject": request.subject,
                "StartDateTime": request.start_datetime.isoformat(),
                "EndDateTime": request.end_datetime.isoformat(),
                "IsAllDayEvent": request.is_all_day,
                "Type": request.event_type.value,  # Use enum value
            }

            # Add optional fields
            if request.description:
                event_data["Description"] = request.description
            if request.location:
                event_data["Location"] = request.location
            if request.account_id:
                event_data["WhatId"] = request.account_id
            if request.contact_id:
                event_data["WhoId"] = request.contact_id
            if request.lead_id:
                event_data["WhoId"] = request.lead_id
            if request.opportunity_id:
                event_data["WhatId"] = request.opportunity_id

            # Handle reminder
            if request.is_reminder_set and request.reminder_minutes:
                reminder_datetime = request.start_datetime - timedelta(minutes=request.reminder_minutes)
                event_data["IsReminderSet"] = True
                event_data["ReminderDateTime"] = reminder_datetime.isoformat()

            # Create event in Salesforce
            response = requests.post(
                f"{self.base_url}/sobjects/Event",
                headers=self.headers,
                json=event_data,
                timeout=30
            )

            if response.status_code == 201:
                result = response.json()
                event_id = result.get("id")

                logger.info(f"Successfully created Salesforce event: {event_id}")

                # Fetch the created event to return complete data
                return await self._fetch_event_by_id(event_id)
            else:
                error_msg = f"Failed to create event: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)

        except Exception as e:
            logger.error(f"Error creating Salesforce event: {e}")
            raise

    async def update_event(self, event_id: str, request) -> Optional[SalesforceEvent]:
        """
        Update an existing event in Salesforce

        Args:
            event_id: Salesforce event ID
            request: EventUpdateRequest with updated data

        Returns:
            Updated SalesforceEvent if successful, None otherwise
        """
        try:
            logger.info(f"Updating Salesforce event: {event_id}")

            # Extract Salesforce ID from calendar event ID
            salesforce_id = event_id.replace("event_", "") if event_id.startswith("event_") else event_id

            # Prepare update data
            update_data = {}

            if request.subject is not None:
                update_data["Subject"] = request.subject
            if request.description is not None:
                update_data["Description"] = request.description
            if request.start_datetime is not None:
                update_data["StartDateTime"] = request.start_datetime.isoformat()
            if request.end_datetime is not None:
                update_data["EndDateTime"] = request.end_datetime.isoformat()
            if request.is_all_day is not None:
                update_data["IsAllDayEvent"] = request.is_all_day
            if request.location is not None:
                update_data["Location"] = request.location
            if request.status is not None:
                # Note: Event object doesn't have a Status field in Salesforce
                # This might need custom field handling
                pass

            # Handle related records
            if request.account_id is not None:
                update_data["WhatId"] = request.account_id
            if request.contact_id is not None:
                update_data["WhoId"] = request.contact_id
            if request.lead_id is not None:
                update_data["WhoId"] = request.lead_id
            if request.opportunity_id is not None:
                update_data["WhatId"] = request.opportunity_id

            # Handle reminder
            if request.is_reminder_set is not None:
                update_data["IsReminderSet"] = request.is_reminder_set
                if request.is_reminder_set and request.reminder_minutes:
                    start_dt = request.start_datetime if request.start_datetime else None
                    if start_dt:
                        reminder_datetime = start_dt - timedelta(minutes=request.reminder_minutes)
                        update_data["ReminderDateTime"] = reminder_datetime.isoformat()

            # Update event in Salesforce
            response = requests.patch(
                f"{self.base_url}/sobjects/Event/{salesforce_id}",
                headers=self.headers,
                json=update_data,
                timeout=30
            )

            if response.status_code == 204:  # No Content - success
                logger.info(f"Successfully updated Salesforce event: {salesforce_id}")

                # Fetch the updated event to return complete data
                return await self._fetch_event_by_id(salesforce_id)
            else:
                error_msg = f"Failed to update event: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)

        except Exception as e:
            logger.error(f"Error updating Salesforce event {event_id}: {e}")
            raise

    async def delete_event(self, event_id: str) -> bool:
        """
        Delete an event from Salesforce

        Args:
            event_id: Calendar event ID or Salesforce event ID

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Deleting Salesforce event: {event_id}")

            # Extract Salesforce ID from calendar event ID
            salesforce_id = event_id.replace("event_", "") if event_id.startswith("event_") else event_id

            # Delete event from Salesforce
            response = requests.delete(
                f"{self.base_url}/sobjects/Event/{salesforce_id}",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 204:  # No Content - success
                logger.info(f"Successfully deleted Salesforce event: {salesforce_id}")
                return True
            else:
                error_msg = f"Failed to delete event: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return False

        except Exception as e:
            logger.error(f"Error deleting Salesforce event {event_id}: {e}")
            return False

    async def create_task(self, request) -> Optional[SalesforceTask]:
        """
        Create a new task in Salesforce

        Args:
            request: TaskCreateRequest with task data

        Returns:
            SalesforceTask if successful, None otherwise
        """
        try:
            from ..schemas.event_schemas import TaskCreateRequest

            logger.info(f"Creating Salesforce task: {request.subject}")

            # Prepare task data for Salesforce API
            task_data = {
                "Subject": request.subject,
                "Status": request.status.value if request.status else "Not Started",
                "Priority": request.priority or "Normal",
            }

            # Add optional fields
            if request.description:
                task_data["Description"] = request.description
            if request.activity_date:
                task_data["ActivityDate"] = request.activity_date.isoformat()
            if request.account_id:
                task_data["WhatId"] = request.account_id
            if request.contact_id:
                task_data["WhoId"] = request.contact_id
            if request.lead_id:
                task_data["WhoId"] = request.lead_id
            if request.opportunity_id:
                task_data["WhatId"] = request.opportunity_id

            # Handle reminder
            if request.is_reminder_set and request.reminder_minutes and request.activity_date:
                # For tasks, reminder is typically set relative to the activity date
                activity_datetime = datetime.combine(request.activity_date, datetime.min.time())
                reminder_datetime = activity_datetime - timedelta(minutes=request.reminder_minutes)
                task_data["IsReminderSet"] = True
                task_data["ReminderDateTime"] = reminder_datetime.isoformat()

            # Create task in Salesforce
            response = requests.post(
                f"{self.base_url}/sobjects/Task",
                headers=self.headers,
                json=task_data,
                timeout=30
            )

            if response.status_code == 201:
                result = response.json()
                task_id = result.get("id")

                logger.info(f"Successfully created Salesforce task: {task_id}")

                # Fetch the created task to return complete data
                return await self._fetch_task_by_id(task_id)
            else:
                error_msg = f"Failed to create task: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)

        except Exception as e:
            logger.error(f"Error creating Salesforce task: {e}")
            raise

    async def update_task(self, task_id: str, request) -> Optional[SalesforceTask]:
        """
        Update an existing task in Salesforce

        Args:
            task_id: Salesforce task ID
            request: TaskUpdateRequest with updated data

        Returns:
            Updated SalesforceTask if successful, None otherwise
        """
        try:
            logger.info(f"Updating Salesforce task: {task_id}")

            # Extract Salesforce ID from calendar task ID
            salesforce_id = task_id.replace("task_", "") if task_id.startswith("task_") else task_id

            # Prepare update data
            update_data = {}

            if request.subject is not None:
                update_data["Subject"] = request.subject
            if request.description is not None:
                update_data["Description"] = request.description
            if request.activity_date is not None:
                update_data["ActivityDate"] = request.activity_date.isoformat()
            if request.status is not None:
                update_data["Status"] = request.status.value
            if request.priority is not None:
                update_data["Priority"] = request.priority

            # Handle related records
            if request.account_id is not None:
                update_data["WhatId"] = request.account_id
            if request.contact_id is not None:
                update_data["WhoId"] = request.contact_id
            if request.lead_id is not None:
                update_data["WhoId"] = request.lead_id
            if request.opportunity_id is not None:
                update_data["WhatId"] = request.opportunity_id

            # Handle reminder
            if request.is_reminder_set is not None:
                update_data["IsReminderSet"] = request.is_reminder_set
                if request.is_reminder_set and request.reminder_minutes and request.activity_date:
                    activity_datetime = datetime.combine(request.activity_date, datetime.min.time())
                    reminder_datetime = activity_datetime - timedelta(minutes=request.reminder_minutes)
                    update_data["ReminderDateTime"] = reminder_datetime.isoformat()

            # Update task in Salesforce
            response = requests.patch(
                f"{self.base_url}/sobjects/Task/{salesforce_id}",
                headers=self.headers,
                json=update_data,
                timeout=30
            )

            if response.status_code == 204:  # No Content - success
                logger.info(f"Successfully updated Salesforce task: {salesforce_id}")

                # Fetch the updated task to return complete data
                return await self._fetch_task_by_id(salesforce_id)
            else:
                error_msg = f"Failed to update task: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)

        except Exception as e:
            logger.error(f"Error updating Salesforce task {task_id}: {e}")
            raise

    async def delete_task(self, task_id: str) -> bool:
        """
        Delete a task from Salesforce

        Args:
            task_id: Calendar task ID or Salesforce task ID

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Deleting Salesforce task: {task_id}")

            # Extract Salesforce ID from calendar task ID
            salesforce_id = task_id.replace("task_", "") if task_id.startswith("task_") else task_id

            # Delete task from Salesforce
            response = requests.delete(
                f"{self.base_url}/sobjects/Task/{salesforce_id}",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 204:  # No Content - success
                logger.info(f"Successfully deleted Salesforce task: {salesforce_id}")
                return True
            else:
                error_msg = f"Failed to delete task: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return False

        except Exception as e:
            logger.error(f"Error deleting Salesforce task {task_id}: {e}")
            return False

    async def _fetch_salesforce_events(
        self,
        start_date: date,
        end_date: date,
        event_filter: Optional[EventFilter] = None
    ) -> List[SalesforceEvent]:
        """Fetch Event objects from Salesforce"""
        try:
            # Build SOQL query for Events
            fields = [
                "Id", "Subject", "Description", "StartDateTime", "EndDateTime",
                "IsAllDayEvent", "Location", "Type", "EventSubtype",
                "OwnerId", "Owner.Name", "AccountId", "Account.Name",
                "WhoId", "Who.Name", "WhatId", "What.Name",
                "IsRecurrence", "RecurrenceType", "RecurrenceInterval",
                "RecurrenceDayOfWeekMask", "RecurrenceDayOfMonth",
                "RecurrenceStartDateTime", "RecurrenceEndDateOnly",
                "IsReminderSet", "ReminderDateTime",
                "CreatedDate", "CreatedById", "LastModifiedDate", "LastModifiedById"
            ]

            # Base WHERE clause
            where_conditions = [
                f"StartDateTime >= {start_date.isoformat()}T00:00:00Z",
                f"StartDateTime <= {end_date.isoformat()}T23:59:59Z"
            ]

            # Apply filters
            if event_filter:
                if event_filter.owner_ids:
                    owner_list = "','".join(event_filter.owner_ids)
                    where_conditions.append(f"OwnerId IN ('{owner_list}')")

                if event_filter.account_ids:
                    account_list = "','".join(event_filter.account_ids)
                    where_conditions.append(f"AccountId IN ('{account_list}')")

                if event_filter.search_term:
                    search_term = event_filter.search_term.replace("'", "\\'")
                    where_conditions.append(f"(Subject LIKE '%{search_term}%' OR Description LIKE '%{search_term}%')")

            query = f"""
                SELECT {', '.join(fields)}
                FROM Event
                WHERE {' AND '.join(where_conditions)}
                ORDER BY StartDateTime ASC
            """

            if event_filter and event_filter.limit:
                query += f" LIMIT {event_filter.limit}"

            if event_filter and event_filter.offset:
                query += f" OFFSET {event_filter.offset}"

            # Execute query
            response = requests.get(
                f"{self.base_url}/query",
                headers=self.headers,
                params={'q': query},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                events = []

                for record in data.get('records', []):
                    try:
                        event = self._parse_salesforce_event(record)
                        events.append(event)
                    except Exception as e:
                        logger.warning(f"Error parsing event {record.get('Id')}: {e}")
                        continue

                return events
            else:
                logger.error(f"Salesforce Events query failed: {response.status_code} - {response.text}")
                return []

        except Exception as e:
            logger.error(f"Error fetching Salesforce events: {e}")
            return []

    async def _fetch_salesforce_tasks(
        self,
        start_date: date,
        end_date: date,
        event_filter: Optional[EventFilter] = None
    ) -> List[SalesforceTask]:
        """Fetch Task objects from Salesforce"""
        try:
            # Build SOQL query for Tasks
            fields = [
                "Id", "Subject", "Description", "ActivityDate", "Status", "Priority",
                "OwnerId", "Owner.Name", "AccountId", "Account.Name",
                "WhoId", "Who.Name", "WhatId", "What.Name",
                "CallDurationInSeconds", "CallType", "CallDisposition", "CallObject",
                "IsReminderSet", "ReminderDateTime",
                "IsClosed", "IsArchived",
                "CreatedDate", "CreatedById", "LastModifiedDate", "LastModifiedById"
            ]

            # Base WHERE clause - include tasks with due dates in range or no due date
            where_conditions = [
                f"(ActivityDate >= {start_date.isoformat()} AND ActivityDate <= {end_date.isoformat()}) OR ActivityDate = null"
            ]

            # Apply filters
            if event_filter:
                if event_filter.owner_ids:
                    owner_list = "','".join(event_filter.owner_ids)
                    where_conditions.append(f"OwnerId IN ('{owner_list}')")

                if event_filter.account_ids:
                    account_list = "','".join(event_filter.account_ids)
                    where_conditions.append(f"AccountId IN ('{account_list}')")

                if event_filter.search_term:
                    search_term = event_filter.search_term.replace("'", "\\'")
                    where_conditions.append(f"(Subject LIKE '%{search_term}%' OR Description LIKE '%{search_term}%')")

                if event_filter.statuses:
                    status_list = "','".join([status.value for status in event_filter.statuses])
                    where_conditions.append(f"Status IN ('{status_list}')")

            query = f"""
                SELECT {', '.join(fields)}
                FROM Task
                WHERE {' AND '.join(where_conditions)}
                ORDER BY ActivityDate ASC NULLS LAST, CreatedDate DESC
            """

            if event_filter and event_filter.limit:
                query += f" LIMIT {event_filter.limit}"

            if event_filter and event_filter.offset:
                query += f" OFFSET {event_filter.offset}"

            # Execute query
            response = requests.get(
                f"{self.base_url}/query",
                headers=self.headers,
                params={'q': query},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                tasks = []

                for record in data.get('records', []):
                    try:
                        task = self._parse_salesforce_task(record)
                        tasks.append(task)
                    except Exception as e:
                        task_id = record.get('Id', 'Unknown')
                        subject = record.get('Subject', 'No Subject')
                        logger.warning(f"Error parsing task {task_id} (Subject: '{subject}'): {e}")
                        logger.debug(f"Failed task record: {record}")
                        continue

                return tasks
            else:
                logger.error(f"Salesforce Tasks query failed: {response.status_code} - {response.text}")
                return []

        except Exception as e:
            logger.error(f"Error fetching Salesforce tasks: {e}")
            return []

    def _parse_salesforce_event(self, record: Dict[str, Any]) -> SalesforceEvent:
        """Parse Salesforce Event record into SalesforceEvent model"""
        try:
            # Parse datetime fields using helper method for consistency
            start_datetime = self._parse_salesforce_datetime(record['StartDateTime'])
            end_datetime = self._parse_salesforce_datetime(record['EndDateTime'])

            # Parse optional datetime fields
            created_date = None
            if record.get('CreatedDate'):
                created_date = self._parse_salesforce_datetime(record['CreatedDate'])

            last_modified_date = None
            if record.get('LastModifiedDate'):
                last_modified_date = self._parse_salesforce_datetime(record['LastModifiedDate'])

            reminder_datetime = None
            if record.get('ReminderDateTime'):
                reminder_datetime = self._parse_salesforce_datetime(record['ReminderDateTime'])

            # Parse recurrence fields
            recurrence_start_date = None
            if record.get('RecurrenceStartDateTime'):
                recurrence_start_date = datetime.fromisoformat(record['RecurrenceStartDateTime'].replace('Z', '+00:00')).date()

            recurrence_end_date = None
            if record.get('RecurrenceEndDateOnly'):
                recurrence_end_date = datetime.fromisoformat(record['RecurrenceEndDateOnly']).date()

            return SalesforceEvent(
                id=record['Id'],
                subject=record.get('Subject', ''),
                description=record.get('Description'),
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                is_all_day=record.get('IsAllDayEvent', False),
                location=record.get('Location'),
                event_type=EventType.EVENT,  # Default to EVENT
                status=EventStatus.PLANNED,  # Default status

                # Owner information
                owner_id=record.get('OwnerId'),
                owner_name=record.get('Owner', {}).get('Name') if record.get('Owner') else None,

                # Related records
                account_id=record.get('AccountId'),
                account_name=record.get('Account', {}).get('Name') if record.get('Account') else None,
                what_id=record.get('WhatId'),
                who_id=record.get('WhoId'),

                # Recurrence
                is_recurring=record.get('IsRecurrence', False),
                recurrence_type=record.get('RecurrenceType'),
                recurrence_interval=record.get('RecurrenceInterval'),
                recurrence_day_of_week_mask=record.get('RecurrenceDayOfWeekMask'),
                recurrence_day_of_month=record.get('RecurrenceDayOfMonth'),
                recurrence_start_date=recurrence_start_date,
                recurrence_end_date=recurrence_end_date,

                # Reminder
                is_reminder_set=record.get('IsReminderSet', False),
                reminder_datetime=reminder_datetime,

                # System fields
                created_date=created_date,
                created_by_id=record.get('CreatedById'),
                last_modified_date=last_modified_date,
                last_modified_by_id=record.get('LastModifiedById')
            )

        except Exception as e:
            logger.error(f"Error parsing Salesforce event record: {e}")
            raise

    def _parse_salesforce_task(self, record: Dict[str, Any]) -> SalesforceTask:
        """Parse Salesforce Task record into SalesforceTask model"""
        try:
            # Validate required fields
            if not record.get('Id'):
                raise ValueError("Task record missing required 'Id' field")

            task_id = record['Id']
            # Parse date fields
            activity_date = None
            if record.get('ActivityDate'):
                activity_date = datetime.fromisoformat(record['ActivityDate']).date()

            # Parse optional datetime fields with timezone awareness
            created_date = None
            if record.get('CreatedDate'):
                created_date = self._parse_salesforce_datetime(record['CreatedDate'])

            last_modified_date = None
            if record.get('LastModifiedDate'):
                last_modified_date = self._parse_salesforce_datetime(record['LastModifiedDate'])

            reminder_datetime = None
            if record.get('ReminderDateTime'):
                reminder_datetime = self._parse_salesforce_datetime(record['ReminderDateTime'])

            # Map status
            status = EventStatus.NOT_STARTED
            if record.get('Status'):
                try:
                    status = EventStatus(record['Status'])
                except ValueError:
                    # Handle custom status values
                    if record['Status'].lower() in ['completed', 'closed']:
                        status = EventStatus.COMPLETED
                    elif record['Status'].lower() in ['in progress', 'started']:
                        status = EventStatus.IN_PROGRESS

            # Handle subject field with proper fallback for None values
            subject = record.get('Subject')
            if not subject or subject.strip() == '':
                # Provide meaningful fallback for missing subjects
                subject = f"Task {task_id}"
                logger.warning(f"Task {task_id} has no subject, using fallback: {subject}")

            return SalesforceTask(
                id=task_id,
                subject=subject,
                description=record.get('Description'),
                status=status,
                priority=record.get('Priority', 'Normal'),

                # Date fields
                activity_date=activity_date,
                reminder_datetime=reminder_datetime,
                is_reminder_set=record.get('IsReminderSet', False),

                # Owner information
                owner_id=record.get('OwnerId'),
                owner_name=record.get('Owner', {}).get('Name') if record.get('Owner') else None,

                # Related records
                account_id=record.get('AccountId'),
                account_name=record.get('Account', {}).get('Name') if record.get('Account') else None,
                what_id=record.get('WhatId'),
                who_id=record.get('WhoId'),

                # Task specific fields
                call_duration_in_seconds=record.get('CallDurationInSeconds'),
                call_type=record.get('CallType'),
                call_disposition=record.get('CallDisposition'),
                call_object=record.get('CallObject'),

                # System fields
                created_date=created_date,
                created_by_id=record.get('CreatedById'),
                last_modified_date=last_modified_date,
                last_modified_by_id=record.get('LastModifiedById'),

                # Completion tracking
                is_closed=record.get('IsClosed', False),
                is_archived=record.get('IsArchived', False)
            )

        except Exception as e:
            logger.error(f"Error parsing Salesforce task record: {e}")
            logger.error(f"Record data: {record}")
            raise

    def _parse_salesforce_datetime(self, datetime_str: str) -> datetime:
        """Parse Salesforce datetime string ensuring timezone awareness"""
        if not datetime_str:
            return None

        try:
            # Salesforce returns datetime in ISO format with 'Z' suffix for UTC
            if datetime_str.endswith('Z'):
                datetime_str = datetime_str.replace('Z', '+00:00')

            # Parse as timezone-aware datetime
            parsed_dt = datetime.fromisoformat(datetime_str)

            # Ensure timezone awareness
            if parsed_dt.tzinfo is None:
                # If somehow we get a naive datetime, assume UTC
                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                logger.warning(f"Converted naive datetime to UTC: {datetime_str}")

            return parsed_dt

        except Exception as e:
            logger.error(f"Error parsing Salesforce datetime '{datetime_str}': {e}")
            return None

    def _convert_event_to_calendar_event(self, event: SalesforceEvent) -> CalendarEvent:
        """Convert SalesforceEvent to CalendarEvent for frontend"""
        try:
            # Generate unique ID for calendar
            calendar_id = f"event_{event.id}"

            # Determine colors based on event type and status
            color_map = {
                EventType.MEETING: "#1976d2",  # Blue
                EventType.CALL: "#388e3c",     # Green
                EventType.EMAIL: "#f57c00",    # Orange
                EventType.EVENT: "#7b1fa2",    # Purple
            }

            # Build related record info
            related_to = None
            if event.account_id:
                related_to = {
                    "id": event.account_id,
                    "name": event.account_name,
                    "type": "Account"
                }
            elif event.opportunity_id:
                related_to = {
                    "id": event.opportunity_id,
                    "name": event.opportunity_name,
                    "type": "Opportunity"
                }

            related_person = None
            if event.contact_id:
                related_person = {
                    "id": event.contact_id,
                    "name": event.contact_name,
                    "type": "Contact"
                }
            elif event.lead_id:
                related_person = {
                    "id": event.lead_id,
                    "name": event.lead_name,
                    "type": "Lead"
                }

            # Calculate reminder minutes with proper timezone handling
            reminder_minutes = None
            if event.is_reminder_set and event.reminder_datetime:
                try:
                    # Ensure both datetimes are timezone-aware for comparison
                    reminder_dt = event.reminder_datetime
                    start_dt = event.start_datetime

                    # If either datetime is naive, make it timezone-aware (assume UTC)
                    if reminder_dt.tzinfo is None:
                        reminder_dt = reminder_dt.replace(tzinfo=timezone.utc)
                        logger.warning(f"Converted naive reminder datetime to UTC for event {event.id}")

                    if start_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=timezone.utc)
                        logger.warning(f"Converted naive start datetime to UTC for event {event.id}")

                    # Calculate the difference
                    delta = start_dt - reminder_dt
                    reminder_minutes = int(delta.total_seconds() / 60)

                    # Ensure reminder minutes is positive (reminder should be before the event)
                    if reminder_minutes < 0:
                        reminder_minutes = abs(reminder_minutes)

                except Exception as e:
                    logger.warning(f"Error calculating reminder minutes for event {event.id}: {e}")
                    reminder_minutes = None

            return CalendarEvent(
                id=calendar_id,
                title=event.subject,
                start=event.start_datetime,
                end=event.end_datetime,
                all_day=event.is_all_day,
                description=event.description,
                location=event.location,
                status=event.status.value.lower(),
                event_type=event.event_type.value.lower(),
                salesforce_id=event.id,
                salesforce_type="Event",
                owner_name=event.owner_name,
                related_to=related_to,
                related_person=related_person,
                is_recurring=event.is_recurring,
                color=color_map.get(event.event_type, "#757575"),
                has_reminder=event.is_reminder_set,
                reminder_minutes=reminder_minutes,
                created_at=event.created_date,
                updated_at=event.last_modified_date
            )

        except Exception as e:
            logger.error(f"Error converting event to calendar event: {e}")
            raise

    def _convert_task_to_calendar_event(self, task: SalesforceTask) -> CalendarEvent:
        """Convert SalesforceTask to CalendarEvent for frontend"""
        try:
            # Generate unique ID for calendar
            calendar_id = f"task_{task.id}"

            # For tasks, use activity date as start time (all day if no specific time)
            start_datetime = task.activity_date
            if start_datetime:
                # Convert date to timezone-aware datetime (start of day in UTC)
                start_datetime = datetime.combine(start_datetime, datetime.min.time())
                start_datetime = start_datetime.replace(tzinfo=timezone.utc)
            else:
                # Use creation date if no activity date, ensure timezone awareness
                if task.created_date:
                    start_datetime = task.created_date
                else:
                    start_datetime = datetime.now(timezone.utc)

            # Tasks are typically all-day unless they have specific times
            is_all_day = True
            end_datetime = None

            # Task color based on priority and status
            if task.status == EventStatus.COMPLETED:
                color = "#4caf50"  # Green for completed
            elif task.status == EventStatus.IN_PROGRESS:
                color = "#ff9800"  # Orange for in progress
            elif task.priority == "High":
                color = "#f44336"  # Red for high priority
            else:
                color = "#9e9e9e"  # Gray for normal tasks

            # Build related record info
            related_to = None
            if task.account_id:
                related_to = {
                    "id": task.account_id,
                    "name": task.account_name,
                    "type": "Account"
                }
            elif task.opportunity_id:
                related_to = {
                    "id": task.opportunity_id,
                    "name": task.opportunity_name,
                    "type": "Opportunity"
                }

            related_person = None
            if task.contact_id:
                related_person = {
                    "id": task.contact_id,
                    "name": task.contact_name,
                    "type": "Contact"
                }
            elif task.lead_id:
                related_person = {
                    "id": task.lead_id,
                    "name": task.lead_name,
                    "type": "Lead"
                }

            # Calculate reminder minutes with proper timezone handling
            reminder_minutes = None
            if task.is_reminder_set and task.reminder_datetime and start_datetime:
                try:
                    # Ensure both datetimes are timezone-aware for comparison
                    reminder_dt = task.reminder_datetime
                    start_dt = start_datetime

                    # If either datetime is naive, make it timezone-aware (assume UTC)
                    if reminder_dt.tzinfo is None:
                        reminder_dt = reminder_dt.replace(tzinfo=timezone.utc)
                        logger.warning(f"Converted naive reminder datetime to UTC for task {task.id}")

                    if start_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=timezone.utc)
                        logger.warning(f"Converted naive start datetime to UTC for task {task.id}")

                    # Calculate the difference
                    delta = start_dt - reminder_dt
                    reminder_minutes = int(delta.total_seconds() / 60)

                    # Ensure reminder minutes is positive (reminder should be before the event)
                    if reminder_minutes < 0:
                        reminder_minutes = abs(reminder_minutes)

                except Exception as e:
                    logger.warning(f"Error calculating reminder minutes for task {task.id}: {e}")
                    reminder_minutes = None

            # Add priority and status to title
            title_prefix = ""
            if task.priority and task.priority != "Normal":
                title_prefix += f"[{task.priority}] "
            if task.status != EventStatus.NOT_STARTED:
                title_prefix += f"[{task.status.value}] "

            return CalendarEvent(
                id=calendar_id,
                title=f"{title_prefix}{task.subject}",
                start=start_datetime,
                end=end_datetime,
                all_day=is_all_day,
                description=task.description,
                status=task.status.value.lower(),
                event_type="task",
                salesforce_id=task.id,
                salesforce_type="Task",
                owner_name=task.owner_name,
                related_to=related_to,
                related_person=related_person,
                is_recurring=False,  # Tasks don't have recurrence
                color=color,
                has_reminder=task.is_reminder_set,
                reminder_minutes=reminder_minutes,
                created_at=task.created_date,
                updated_at=task.last_modified_date,
                # Tasks are generally not editable in calendar view
                editable=False,
                start_editable=False,
                duration_editable=False
            )

        except Exception as e:
            logger.error(f"Error converting task to calendar event: {e}")
            raise

    async def _fetch_event_by_id(self, event_id: str) -> Optional[SalesforceEvent]:
        """
        Fetch a single event by ID from Salesforce

        Args:
            event_id: Salesforce event ID

        Returns:
            SalesforceEvent if found, None otherwise
        """
        try:
            # Build SOQL query for single event
            fields = [
                "Id", "Subject", "Description", "StartDateTime", "EndDateTime",
                "IsAllDayEvent", "Location", "Type", "EventSubtype",
                "OwnerId", "Owner.Name", "AccountId", "Account.Name",
                "WhoId", "Who.Name", "WhatId", "What.Name",
                "IsRecurrence", "RecurrenceType", "RecurrenceInterval",
                "RecurrenceDayOfWeekMask", "RecurrenceDayOfMonth",
                "RecurrenceStartDateTime", "RecurrenceEndDateOnly",
                "IsReminderSet", "ReminderDateTime",
                "CreatedDate", "CreatedById", "LastModifiedDate", "LastModifiedById"
            ]

            query = f"""
                SELECT {', '.join(fields)}
                FROM Event
                WHERE Id = '{event_id}'
                LIMIT 1
            """

            # Execute query
            response = requests.get(
                f"{self.base_url}/query",
                headers=self.headers,
                params={'q': query},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                records = data.get('records', [])

                if records:
                    return self._parse_salesforce_event(records[0])
                else:
                    logger.warning(f"Event not found: {event_id}")
                    return None
            else:
                logger.error(f"Failed to fetch event {event_id}: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"Error fetching event by ID {event_id}: {e}")
            return None

    async def _fetch_task_by_id(self, task_id: str) -> Optional[SalesforceTask]:
        """
        Fetch a single task by ID from Salesforce

        Args:
            task_id: Salesforce task ID

        Returns:
            SalesforceTask if found, None otherwise
        """
        try:
            # Build SOQL query for single task
            fields = [
                "Id", "Subject", "Description", "ActivityDate", "Status", "Priority",
                "OwnerId", "Owner.Name", "AccountId", "Account.Name",
                "WhoId", "Who.Name", "WhatId", "What.Name",
                "CallDurationInSeconds", "CallType", "CallDisposition", "CallObject",
                "IsReminderSet", "ReminderDateTime",
                "IsClosed", "IsArchived",
                "CreatedDate", "CreatedById", "LastModifiedDate", "LastModifiedById"
            ]

            query = f"""
                SELECT {', '.join(fields)}
                FROM Task
                WHERE Id = '{task_id}'
                LIMIT 1
            """

            # Execute query
            response = requests.get(
                f"{self.base_url}/query",
                headers=self.headers,
                params={'q': query},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                records = data.get('records', [])

                if records:
                    return self._parse_salesforce_task(records[0])
                else:
                    logger.warning(f"Task not found: {task_id}")
                    return None
            else:
                logger.error(f"Failed to fetch task {task_id}: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"Error fetching task by ID {task_id}: {e}")
            return None
