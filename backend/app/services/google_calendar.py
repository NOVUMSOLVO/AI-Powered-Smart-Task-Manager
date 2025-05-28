from __future__ import print_function

import os
import datetime
from typing import List, Dict, Any, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Define the scopes required for Google Calendar API
SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleCalendarService:
    """Service for integrating with Google Calendar API"""
    
    def __init__(self, token_path: str = 'token.json', credentials_path: str = 'credentials.json'):
        """
        Initialize the Google Calendar service.
        
        Args:
            token_path: Path to the token file
            credentials_path: Path to the OAuth client credentials file
        """
        self.token_path = token_path
        self.credentials_path = credentials_path
        self.service = None
    
    def authenticate(self) -> bool:
        """
        Authenticate with the Google Calendar API.
        
        Returns:
            bool: True if authentication was successful, False otherwise
        """
        creds = None
        
        # Load existing token if it exists
        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
        
        # If credentials don't exist or are invalid, refresh them or get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    return False
            else:
                if not os.path.exists(self.credentials_path):
                    print(f"Credentials file not found at {self.credentials_path}")
                    return False
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(self.credentials_path, SCOPES)
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"Error during authentication flow: {e}")
                    return False
            
            # Save the credentials for the next run
            with open(self.token_path, 'w') as token:
                token.write(creds.to_json())
        
        try:
            # Build the Google Calendar API service
            self.service = build('calendar', 'v3', credentials=creds)
            return True
        except Exception as e:
            print(f"Error building service: {e}")
            return False
    
    def get_calendar_list(self) -> List[Dict[str, Any]]:
        """
        Get the list of calendars for the authenticated user.
        
        Returns:
            List[Dict[str, Any]]: List of calendar details
        """
        if not self.service:
            if not self.authenticate():
                return []
        
        try:
            # Get list of calendars
            calendar_list = self.service.calendarList().list().execute()
            return calendar_list.get('items', [])
        except HttpError as error:
            print(f"Error retrieving calendars: {error}")
            return []
    
    def create_event_from_task(
        self, 
        task: Dict[str, Any], 
        calendar_id: str = 'primary',
        duration_minutes: int = 60
    ) -> Optional[Dict[str, Any]]:
        """
        Create a Google Calendar event from a task.
        
        Args:
            task: Task data containing title, description, and due_date
            calendar_id: ID of the calendar to create the event in (default: primary)
            duration_minutes: Duration of the event in minutes (default: 60)
            
        Returns:
            Optional[Dict[str, Any]]: Created event details or None if failed
        """
        if not self.service:
            if not self.authenticate():
                return None
        
        try:
            # Parse the due date from the task
            due_date = task.get('due_date')
            if not due_date:
                print("Task doesn't have a due date")
                return None
            
            # If due_date is a string, parse it to datetime
            if isinstance(due_date, str):
                try:
                    due_date = datetime.datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                except ValueError:
                    print(f"Invalid due date format: {due_date}")
                    return None
            
            # Calculate end time (due date + duration)
            end_time = due_date + datetime.timedelta(minutes=duration_minutes)
            
            # Create event
            event = {
                'summary': task.get('title', 'Task'),
                'description': task.get('description', ''),
                'start': {
                    'dateTime': due_date.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': 30},
                    ],
                },
            }
            
            event = self.service.events().insert(calendarId=calendar_id, body=event).execute()
            print(f"Event created: {event.get('htmlLink')}")
            return event
        
        except HttpError as error:
            print(f"Error creating event: {error}")
            return None
    
    def synchronize_tasks_with_calendar(
        self, 
        tasks: List[Dict[str, Any]], 
        calendar_id: str = 'primary'
    ) -> Dict[str, int]:
        """
        Synchronize multiple tasks with Google Calendar.
        
        Args:
            tasks: List of tasks to synchronize
            calendar_id: ID of the calendar to sync with (default: primary)
            
        Returns:
            Dict[str, int]: Summary of synchronization (success/failure counts)
        """
        results = {
            'success': 0,
            'failed': 0
        }
        
        if not self.service:
            if not self.authenticate():
                return results
        
        for task in tasks:
            result = self.create_event_from_task(task, calendar_id)
            if result:
                results['success'] += 1
            else:
                results['failed'] += 1
        
        return results
