# API schemas for calendar endpoints
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from ..models.event import EventType, EventStatus, RecurrenceType


class EventCreateRequest(BaseModel):
    """Request schema for creating a new event"""
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    is_all_day: bool = False
    location: Optional[str] = None
    event_type: EventType = EventType.EVENT
    status: EventStatus = EventStatus.PLANNED

    # Related records
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None

    # Recurrence
    is_recurring: bool = False
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_interval: Optional[int] = None
    recurrence_end_date: Optional[date] = None

    # Reminder
    is_reminder_set: bool = False
    reminder_minutes: Optional[int] = None

    @validator('end_datetime')
    def end_after_start(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('End datetime must be after start datetime')
        return v


class EventUpdateRequest(BaseModel):
    """Request schema for updating an event"""
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    location: Optional[str] = None
    status: Optional[EventStatus] = None

    # Related records
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None

    # Reminder
    is_reminder_set: Optional[bool] = None
    reminder_minutes: Optional[int] = None


class TaskCreateRequest(BaseModel):
    """Request schema for creating a new task"""
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    activity_date: Optional[date] = None  # Due date
    priority: Optional[str] = "Normal"
    status: EventStatus = EventStatus.NOT_STARTED

    # Related records
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None

    # Reminder
    is_reminder_set: bool = False
    reminder_minutes: Optional[int] = None


class TaskUpdateRequest(BaseModel):
    """Request schema for updating a task"""
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    activity_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[EventStatus] = None

    # Related records
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None

    # Reminder
    is_reminder_set: Optional[bool] = None
    reminder_minutes: Optional[int] = None


class EventsQueryRequest(BaseModel):
    """Request schema for querying events"""
    start_date: date = Field(..., description="Start date for event range")
    end_date: date = Field(..., description="End date for event range")

    # Filters
    event_types: Optional[List[EventType]] = None
    statuses: Optional[List[EventStatus]] = None
    owner_ids: Optional[List[str]] = None
    account_ids: Optional[List[str]] = None
    include_tasks: bool = True
    include_events: bool = True
    include_recurring: bool = True

    # Search
    search_term: Optional[str] = None

    # Pagination
    limit: Optional[int] = Field(default=1000, le=2000)
    offset: Optional[int] = Field(default=0, ge=0)

    @validator('end_date')
    def end_after_start(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after or equal to start date')
        return v


class CalendarAuthRequest(BaseModel):
    """Request schema for calendar operations requiring Salesforce auth"""
    access_token: str = Field(..., description="Salesforce access token")
    instance_url: str = Field(..., description="Salesforce instance URL")


class EventResponse(BaseModel):
    """Response schema for single event"""
    id: str
    title: str
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    description: Optional[str] = None
    location: Optional[str] = None
    status: str
    event_type: str
    salesforce_id: str
    salesforce_type: str
    owner_name: Optional[str] = None
    related_to: Optional[Dict[str, Any]] = None
    related_person: Optional[Dict[str, Any]] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    has_reminder: bool = False
    reminder_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    editable: bool = True


class EventsResponse(BaseModel):
    """Response schema for multiple events"""
    events: List[EventResponse]
    total_count: int
    has_more: bool = False
    next_offset: Optional[int] = None


class EventCreateResponse(BaseModel):
    """Response schema for event creation"""
    success: bool
    event_id: str
    salesforce_id: str
    message: str
    event: Optional[EventResponse] = None


class EventUpdateResponse(BaseModel):
    """Response schema for event update"""
    success: bool
    message: str
    event: Optional[EventResponse] = None


class EventDeleteResponse(BaseModel):
    """Response schema for event deletion"""
    success: bool
    message: str


class CalendarErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class RecurrenceInfo(BaseModel):
    """Recurrence information for events"""
    type: RecurrenceType
    interval: int = 1
    days_of_week: Optional[List[int]] = None  # 0=Sunday, 1=Monday, etc.
    day_of_month: Optional[int] = None
    end_date: Optional[date] = None
    occurrences: Optional[int] = None


class EventSummary(BaseModel):
    """Summary information for calendar overview"""
    total_events: int
    total_tasks: int
    upcoming_events: int
    overdue_tasks: int
    today_events: int
    this_week_events: int
    date_range: Dict[str, date]


class CalendarStatsResponse(BaseModel):
    """Response schema for calendar statistics"""
    success: bool
    summary: EventSummary
    by_type: Dict[str, int]
    by_status: Dict[str, int]
    by_owner: Dict[str, int]
