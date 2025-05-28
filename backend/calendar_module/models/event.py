# Calendar event models for Salesforce integration
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class EventType(str, Enum):
    """Event types from Salesforce"""
    EVENT = "Event"
    TASK = "Task"
    MEETING = "Meeting"
    CALL = "Call"
    EMAIL = "Email"


class EventStatus(str, Enum):
    """Event status options"""
    PLANNED = "Planned"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NOT_STARTED = "Not Started"


class RecurrenceType(str, Enum):
    """Recurrence pattern types"""
    DAILY = "Daily"
    WEEKLY = "Weekly"
    MONTHLY = "Monthly"
    YEARLY = "Yearly"


class SalesforceEvent(BaseModel):
    """Salesforce Event object model"""
    id: Optional[str] = None
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_datetime: datetime = Field(..., description="Event start date and time")
    end_datetime: datetime = Field(..., description="Event end date and time")
    is_all_day: bool = False
    location: Optional[str] = None
    event_type: EventType = EventType.EVENT
    status: EventStatus = EventStatus.PLANNED
    
    # Salesforce specific fields
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    lead_id: Optional[str] = None
    lead_name: Optional[str] = None
    opportunity_id: Optional[str] = None
    opportunity_name: Optional[str] = None
    
    # Recurrence fields
    is_recurring: bool = False
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_interval: Optional[int] = None
    recurrence_day_of_week_mask: Optional[int] = None
    recurrence_day_of_month: Optional[int] = None
    recurrence_instance: Optional[str] = None
    recurrence_activity_id: Optional[str] = None
    recurrence_start_date: Optional[date] = None
    recurrence_end_date: Optional[date] = None
    
    # Reminder fields
    is_reminder_set: bool = False
    reminder_datetime: Optional[datetime] = None
    
    # System fields
    created_date: Optional[datetime] = None
    created_by_id: Optional[str] = None
    last_modified_date: Optional[datetime] = None
    last_modified_by_id: Optional[str] = None
    
    # Additional metadata
    what_id: Optional[str] = None  # Related record ID
    what_type: Optional[str] = None  # Related record type
    who_id: Optional[str] = None  # Related person ID
    who_type: Optional[str] = None  # Related person type
    
    @validator('end_datetime')
    def end_after_start(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('End datetime must be after start datetime')
        return v
    
    @validator('recurrence_end_date')
    def recurrence_end_after_start(cls, v, values):
        if v and 'recurrence_start_date' in values and values['recurrence_start_date']:
            if v <= values['recurrence_start_date']:
                raise ValueError('Recurrence end date must be after start date')
        return v


class SalesforceTask(BaseModel):
    """Salesforce Task object model"""
    id: Optional[str] = None
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: EventStatus = EventStatus.NOT_STARTED
    priority: Optional[str] = "Normal"
    
    # Date fields
    activity_date: Optional[date] = None  # Due date
    reminder_datetime: Optional[datetime] = None
    is_reminder_set: bool = False
    
    # Salesforce specific fields
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    lead_id: Optional[str] = None
    lead_name: Optional[str] = None
    opportunity_id: Optional[str] = None
    opportunity_name: Optional[str] = None
    
    # Task specific fields
    call_duration_in_seconds: Optional[int] = None
    call_type: Optional[str] = None
    call_disposition: Optional[str] = None
    call_object: Optional[str] = None
    
    # System fields
    created_date: Optional[datetime] = None
    created_by_id: Optional[str] = None
    last_modified_date: Optional[datetime] = None
    last_modified_by_id: Optional[str] = None
    
    # Additional metadata
    what_id: Optional[str] = None  # Related record ID
    what_type: Optional[str] = None  # Related record type
    who_id: Optional[str] = None  # Related person ID
    who_type: Optional[str] = None  # Related person type
    
    # Completion tracking
    is_closed: bool = False
    is_archived: bool = False


class CalendarEvent(BaseModel):
    """Unified calendar event model for frontend consumption"""
    id: str
    title: str
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    
    # Event details
    description: Optional[str] = None
    location: Optional[str] = None
    status: str = "planned"
    event_type: str = "event"
    
    # Salesforce metadata
    salesforce_id: Optional[str] = None
    salesforce_type: str = "Event"  # Event or Task
    owner_name: Optional[str] = None
    
    # Related records
    related_to: Optional[Dict[str, Any]] = None  # Account, Opportunity, etc.
    related_person: Optional[Dict[str, Any]] = None  # Contact, Lead
    
    # Recurrence
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None  # RRULE string for FullCalendar
    
    # UI properties
    color: Optional[str] = None
    background_color: Optional[str] = None
    border_color: Optional[str] = None
    text_color: Optional[str] = None
    
    # Reminder
    has_reminder: bool = False
    reminder_minutes: Optional[int] = None
    
    # System fields
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Additional properties for FullCalendar
    editable: bool = True
    start_editable: bool = True
    duration_editable: bool = True
    resource_editable: bool = True
    
    class Config:
        # Allow extra fields for FullCalendar properties
        extra = "allow"


class EventDateRange(BaseModel):
    """Date range for fetching events"""
    start_date: date = Field(..., description="Start date for event range")
    end_date: date = Field(..., description="End date for event range")
    
    @validator('end_date')
    def end_after_start(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after or equal to start date')
        return v


class EventFilter(BaseModel):
    """Filters for event queries"""
    event_types: Optional[List[EventType]] = None
    statuses: Optional[List[EventStatus]] = None
    owner_ids: Optional[List[str]] = None
    account_ids: Optional[List[str]] = None
    include_tasks: bool = True
    include_events: bool = True
    include_recurring: bool = True
    
    # Date range
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    # Search
    search_term: Optional[str] = None
    
    # Pagination
    limit: Optional[int] = Field(default=1000, le=2000)
    offset: Optional[int] = Field(default=0, ge=0)
