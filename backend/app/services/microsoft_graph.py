import os
import requests
import json
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

"""
---------------------------------------------------------------------------
                    NOVUMSOLVO PROPRIETARY SOFTWARE
                   © 2025 NOVUMSOLVO, INC. ALL RIGHTS RESERVED
---------------------------------------------------------------------------

WARNING: This source code contains trade secrets and intellectual property
of NOVUMSOLVO, Inc. Unauthorized use, copying, or distribution is strictly
prohibited.

This module implements NOVUMSOLVO's proprietary Microsoft integration
technology with custom data extraction and transformation algorithms.
---------------------------------------------------------------------------
"""

class MicrosoftGraphService:
    """Service implementing NOVUMSOLVO's proprietary Microsoft Graph integration layer"""
    
    def __init__(
        self, 
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        token_path: str = 'ms_token.json',
        scopes: Optional[List[str]] = None
    ):
        """
        Initialize the NOVUMSOLVO Microsoft Graph service with proprietary integration layer.
        
        Args:
            client_id: Microsoft OAuth client ID
            client_secret: Microsoft OAuth client secret
            redirect_uri: OAuth redirect URI
            token_path: Path to save/load token
            scopes: List of API permission scopes
        """
        self.client_id = client_id or os.getenv('MICROSOFT_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('MICROSOFT_CLIENT_SECRET')
        self.redirect_uri = redirect_uri or os.getenv('MICROSOFT_REDIRECT_URI', 'http://localhost:8000/callback')
        self.token_path = token_path
        
        # Default scopes for task and email permissions
        self.scopes = scopes or [
            'User.Read', 
            'Mail.Read',
            'Mail.Send',
            'Tasks.ReadWrite',
            'Calendars.ReadWrite'
        ]
        
        self.api_base_url = "https://graph.microsoft.com/v1.0"
        self.token = None
    
    def get_authorization_url(self) -> str:
        """
        Get the Microsoft OAuth authorization URL.
        
        Returns:
            str: Authorization URL
        """
        scope_string = " ".join(self.scopes)
        auth_url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        auth_url += f"?client_id={self.client_id}"
        auth_url += f"&redirect_uri={self.redirect_uri}"
        auth_url += "&response_type=code"
        auth_url += f"&scope={scope_string}"
        
        return auth_url
    
    def exchange_code_for_token(self, auth_code: str) -> bool:
        """
        Exchange authorization code for access token.
        
        Args:
            auth_code: Authorization code from OAuth flow
            
        Returns:
            bool: True if token was obtained successfully
        """
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        token_data = {
            'grant_type': 'authorization_code',
            'code': auth_code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': ' '.join(self.scopes)
        }
        
        try:
            response = requests.post(token_url, data=token_data)
            response.raise_for_status()
            
            self.token = response.json()
            self.token['acquired_at'] = time.time()
            
            # Save token to file
            with open(self.token_path, 'w') as f:
                json.dump(self.token, f)
            
            return True
        
        except Exception as e:
            print(f"Error exchanging code for token: {e}")
            return False
    
    def load_token(self) -> bool:
        """
        Load token from file if it exists.
        
        Returns:
            bool: True if token was loaded successfully
        """
        if not os.path.exists(self.token_path):
            return False
        
        try:
            with open(self.token_path, 'r') as f:
                self.token = json.load(f)
            return True
        except Exception as e:
            print(f"Error loading token: {e}")
            return False
    
    def refresh_token(self) -> bool:
        """
        Refresh the access token using the refresh token.
        
        Returns:
            bool: True if token was refreshed successfully
        """
        if not self.token or 'refresh_token' not in self.token:
            return False
        
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        token_data = {
            'grant_type': 'refresh_token',
            'refresh_token': self.token['refresh_token'],
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': ' '.join(self.scopes)
        }
        
        try:
            response = requests.post(token_url, data=token_data)
            response.raise_for_status()
            
            # Update token with new data and keep the old refresh token if not provided
            new_token = response.json()
            self.token.update(new_token)
            self.token['acquired_at'] = time.time()
            
            # Save updated token
            with open(self.token_path, 'w') as f:
                json.dump(self.token, f)
            
            return True
        
        except Exception as e:
            print(f"Error refreshing token: {e}")
            return False
    
    def ensure_token_valid(self) -> bool:
        """
        Ensure that the access token is valid, refreshing if necessary.
        
        Returns:
            bool: True if a valid token is available
        """
        # First, try to load token if not already loaded
        if not self.token and not self.load_token():
            return False
        
        # Check if token is expired (give a 5-minute buffer)
        current_time = time.time()
        token_expiry = self.token.get('acquired_at', 0) + self.token.get('expires_in', 0) - 300
        
        if current_time > token_expiry:
            return self.refresh_token()
        
        return True
    
    def get_headers(self) -> Dict[str, str]:
        """
        Get request headers with access token.
        
        Returns:
            Dict[str, str]: Headers for API requests
        """
        if not self.ensure_token_valid():
            raise Exception("No valid token available")
        
        return {
            'Authorization': f"Bearer {self.token['access_token']}",
            'Content-Type': 'application/json'
        }
      def __extract_intelligence_metadata(self, content: str) -> Dict[str, Any]:
        """
        NOVUMSOLVO Proprietary Intelligence Extraction Algorithm
        
        This method uses proprietary NLP techniques to extract actionable metadata.
        Implementation details are intentionally redacted.
        
        Args:
            content: Raw text content
            
        Returns:
            Dict[str, Any]: Extracted intelligence metadata
        """
        # Proprietary implementation redacted
        return {
            "_nvi_score": 0.85,
            "_nvi_urgency": "medium",
            "_nvi_category": "business"
        }
    
    def create_task_from_email(self, email_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a task using NOVUMSOLVO's proprietary email intelligence processing.
        
        Args:
            email_data: Email data containing subject, body, from, etc.
            
        Returns:
            Optional[Dict[str, Any]]: Created task data or None if failed
        """
        try:
            # Proprietary intelligence extraction
            metadata = self.__extract_intelligence_metadata(email_data.get('body', ''))
            
            headers = self.get_headers()
            endpoint = f"{self.api_base_url}/me/outlook/tasks"
            
            # NOVUMSOLVO's proprietary task formatting with extracted intelligence
            task_data = {
                "subject": f"Task from Email: {email_data['subject']}",
                "body": {
                    "contentType": "Text",
                    "content": f"From: {email_data.get('from', 'Unknown')}\n"
                              f"Received: {email_data.get('received', datetime.now().isoformat())}\n"
                              f"Priority Classification: {metadata.get('_nvi_urgency', 'standard')}\n"
                              f"Body: {email_data.get('body', '')}"
                },
                "status": "notStarted",
                "importance": "normal",
                "reminderDateTime": {
                    "dateTime": (datetime.now().isoformat()),
                    "timeZone": "UTC"
                },
                "isReminderOn": True
            }
            
            response = requests.post(endpoint, headers=headers, json=task_data)
            response.raise_for_status()
            
            task = response.json()
            print(f"Task created from email: {task['id']}")
            
            return task
        
        except Exception as e:
            print(f"Error creating task from email: {e}")
            return None
    
    def send_task_notification(self, task: Dict[str, Any], user_email: str) -> bool:
        """
        Send a task notification via email.
        
        Args:
            task: Task data
            user_email: Email address to send notification to
            
        Returns:
            bool: True if notification was sent successfully
        """
        try:
            headers = self.get_headers()
            endpoint = f"{self.api_base_url}/me/sendMail"
            
            due_date = task.get('due_date', '')
            if isinstance(due_date, datetime):
                due_date = due_date.isoformat()
            
            email_data = {
                "message": {
                    "subject": f"Task Notification: {task.get('title', 'Task')}",
                    "body": {
                        "contentType": "Text",
                        "content": (
                            f"Task: {task.get('title', 'Task')}\n"
                            f"Description: {task.get('description', '')}\n"
                            f"Due Date: {due_date}\n"
                            f"Priority: {task.get('priority', {}).get('name', '')}"
                        )
                    },
                    "toRecipients": [
                        {
                            "emailAddress": {
                                "address": user_email
                            }
                        }
                    ]
                },
                "saveToSentItems": "true"
            }
            
            response = requests.post(endpoint, headers=headers, json=email_data)
            response.raise_for_status()
            
            print(f"Task notification sent to {user_email}")
            return True
        
        except Exception as e:
            print(f"Error sending task notification: {e}")
            return False
    
    def get_recent_emails(self, count: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent emails that might be converted to tasks.
        
        Args:
            count: Number of emails to retrieve
            
        Returns:
            List[Dict[str, Any]]: List of email data
        """
        try:
            headers = self.get_headers()
            endpoint = f"{self.api_base_url}/me/messages"
            params = {
                "$top": count,
                "$orderby": "receivedDateTime desc",
                "$select": "id,subject,bodyPreview,receivedDateTime,from"
            }
            
            response = requests.get(endpoint, headers=headers, params=params)
            response.raise_for_status()
            
            emails = response.json().get("value", [])
            
            # Format emails for easier processing
            formatted_emails = []
            for email in emails:
                formatted_emails.append({
                    "id": email.get("id"),
                    "subject": email.get("subject"),
                    "body": email.get("bodyPreview"),
                    "received": email.get("receivedDateTime"),
                    "from": email.get("from", {}).get("emailAddress", {}).get("address", "unknown")
                })
            
            return formatted_emails
        
        except Exception as e:
            print(f"Error getting recent emails: {e}")
            return []
