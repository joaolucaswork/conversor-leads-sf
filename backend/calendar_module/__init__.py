# Calendar module package
"""
Calendar module for managing Salesforce events and tasks.

This module provides:
- Calendar event management
- Task management
- Salesforce integration for calendar data
- API endpoints for calendar operations
"""

__version__ = "1.0.0"
__author__ = "Lead Processing System"

# Import main components for easy access
from .api.routes import calendar_router
from .services.event_service import CalendarEventService
from .services.salesforce_calendar_service import SalesforceCalendarService

__all__ = [
    "calendar_router",
    "CalendarEventService", 
    "SalesforceCalendarService"
]
