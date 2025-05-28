# Calendar API routes
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import date, datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import logging

from ..services.event_service import CalendarEventService
from ..schemas.event_schemas import (
    EventsQueryRequest,
    EventCreateRequest,
    EventUpdateRequest,
    TaskCreateRequest,
    TaskUpdateRequest,
    CalendarAuthRequest,
    EventResponse,
    EventsResponse,
    EventCreateResponse,
    EventUpdateResponse,
    EventDeleteResponse,
    CalendarStatsResponse,
    CalendarErrorResponse
)

logger = logging.getLogger(__name__)

# Create router for calendar endpoints
calendar_router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])


def get_calendar_service(auth: CalendarAuthRequest) -> CalendarEventService:
    """
    Create calendar service instance with Salesforce authentication

    Args:
        auth: Calendar authentication request with Salesforce credentials

    Returns:
        CalendarEventService instance
    """
    try:
        # Check for test credentials in environment variables
        import os
        test_access_token = os.getenv("SALESFORCE_ACCESS_TOKEN")
        test_instance_url = os.getenv("SALESFORCE_INSTANCE_URL")

        # Use test credentials if available, otherwise use provided auth
        access_token = test_access_token if test_access_token else auth.access_token
        instance_url = test_instance_url if test_instance_url else auth.instance_url

        if test_access_token and test_instance_url:
            logger.info("Using test Salesforce credentials from environment variables")
        else:
            logger.info("Using provided Salesforce credentials from request")

        return CalendarEventService(access_token, instance_url)
    except Exception as e:
        logger.error(f"Error creating calendar service: {e}")
        raise HTTPException(status_code=401, detail="Invalid Salesforce credentials")


class EventsRequestBody(BaseModel):
    """Request body for events endpoint"""
    query: EventsQueryRequest
    auth: CalendarAuthRequest

@calendar_router.post("/events", response_model=EventsResponse)
async def get_events(
    body: EventsRequestBody
):
    """
    Get calendar events for a date range with optional filters

    Args:
        body: Request body containing query parameters and auth credentials

    Returns:
        EventsResponse with events and metadata
    """
    try:
        logger.info(f"Getting calendar events from {body.query.start_date} to {body.query.end_date}")

        service = get_calendar_service(body.auth)
        result = await service.get_events(body.query)

        logger.info(f"Retrieved {len(result.events)} events")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calendar events: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@calendar_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    auth: CalendarAuthRequest
):
    """
    Get a single calendar event by ID

    Args:
        event_id: Calendar event ID
        auth: Salesforce authentication credentials

    Returns:
        EventResponse with event details
    """
    try:
        logger.info(f"Getting calendar event: {event_id}")

        service = get_calendar_service(auth)
        result = await service.get_event_by_id(event_id)

        if not result:
            raise HTTPException(status_code=404, detail="Event not found")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calendar event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class EventCreateRequestBody(BaseModel):
    """Request body for event creation endpoint"""
    request: EventCreateRequest
    auth: CalendarAuthRequest

@calendar_router.post("/events/create", response_model=EventCreateResponse)
async def create_event(
    body: EventCreateRequestBody
):
    """
    Create a new calendar event

    Args:
        body: Request body containing event data and auth credentials

    Returns:
        EventCreateResponse with created event info
    """
    try:
        logger.info(f"Creating calendar event: {body.request.subject}")

        service = get_calendar_service(body.auth)
        result = await service.create_event(body.request)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating calendar event: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@calendar_router.put("/events/{event_id}", response_model=EventUpdateResponse)
async def update_event(
    event_id: str,
    request: EventUpdateRequest,
    auth: CalendarAuthRequest
):
    """
    Update an existing calendar event

    Args:
        event_id: Calendar event ID
        request: Event update request
        auth: Salesforce authentication credentials

    Returns:
        EventUpdateResponse with update status
    """
    try:
        logger.info(f"Updating calendar event: {event_id}")

        service = get_calendar_service(auth)
        result = await service.update_event(event_id, request)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calendar event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@calendar_router.delete("/events/{event_id}", response_model=EventDeleteResponse)
async def delete_event(
    event_id: str,
    auth: CalendarAuthRequest
):
    """
    Delete a calendar event

    Args:
        event_id: Calendar event ID
        auth: Salesforce authentication credentials

    Returns:
        EventDeleteResponse with deletion status
    """
    try:
        logger.info(f"Deleting calendar event: {event_id}")

        service = get_calendar_service(auth)
        result = await service.delete_event(event_id)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calendar event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class TaskCreateRequestBody(BaseModel):
    """Request body for task creation endpoint"""
    request: TaskCreateRequest
    auth: CalendarAuthRequest

@calendar_router.post("/tasks/create", response_model=EventCreateResponse)
async def create_task(
    body: TaskCreateRequestBody
):
    """
    Create a new task

    Args:
        body: Request body containing task data and auth credentials

    Returns:
        EventCreateResponse with created task info
    """
    try:
        logger.info(f"Creating task: {body.request.subject}")

        service = get_calendar_service(body.auth)
        result = await service.create_task(body.request)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@calendar_router.put("/tasks/{task_id}", response_model=EventUpdateResponse)
async def update_task(
    task_id: str,
    request: TaskUpdateRequest,
    auth: CalendarAuthRequest
):
    """
    Update an existing task

    Args:
        task_id: Task ID
        request: Task update request
        auth: Salesforce authentication credentials

    Returns:
        EventUpdateResponse with update status
    """
    try:
        logger.info(f"Updating task: {task_id}")

        service = get_calendar_service(auth)
        result = await service.update_task(task_id, request)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@calendar_router.post("/stats", response_model=CalendarStatsResponse)
async def get_calendar_stats(
    start_date: date = Query(..., description="Start date for statistics"),
    end_date: date = Query(..., description="End date for statistics"),
    auth: CalendarAuthRequest = Depends()
):
    """
    Get calendar statistics for a date range

    Args:
        start_date: Start date for statistics
        end_date: End date for statistics
        auth: Salesforce authentication credentials

    Returns:
        CalendarStatsResponse with summary statistics
    """
    try:
        logger.info(f"Getting calendar stats from {start_date} to {end_date}")

        service = get_calendar_service(auth)
        result = await service.get_calendar_stats(start_date, end_date)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calendar stats: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Health check endpoint for calendar module
@calendar_router.get("/health")
async def calendar_health_check():
    """
    Health check endpoint for calendar module

    Returns:
        Health status information
    """
    return {
        "status": "healthy",
        "module": "calendar",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
