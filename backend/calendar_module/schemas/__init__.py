# Calendar schemas package
from .event_schemas import (
    EventCreateRequest,
    EventUpdateRequest,
    TaskCreateRequest,
    TaskUpdateRequest,
    EventsQueryRequest,
    CalendarAuthRequest,
    EventResponse,
    EventsResponse,
    EventCreateResponse,
    EventUpdateResponse,
    EventDeleteResponse,
    CalendarErrorResponse,
    RecurrenceInfo,
    EventSummary,
    CalendarStatsResponse
)

__all__ = [
    "EventCreateRequest",
    "EventUpdateRequest",
    "TaskCreateRequest",
    "TaskUpdateRequest",
    "EventsQueryRequest",
    "CalendarAuthRequest",
    "EventResponse",
    "EventsResponse",
    "EventCreateResponse",
    "EventUpdateResponse",
    "EventDeleteResponse",
    "CalendarErrorResponse",
    "RecurrenceInfo",
    "EventSummary",
    "CalendarStatsResponse"
]