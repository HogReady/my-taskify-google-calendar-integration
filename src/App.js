import React, { useState, useEffect } from 'react';

const GoogleCalendarQuickstart = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = gapiLoaded;
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = gisLoaded;
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  const gapiLoaded = () => {
    window.gapi.load('client', initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: 'AIzaSyDaqZQBiqo2YdT5Ag0f-RIpICbzppaPS6Y',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    setGapiInited(true);
    maybeEnableButtons();
  };

  const gisLoaded = () => {
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: '52854098109-sm994nevo268kqtqhft3qkojofi2eeaa.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/calendar', // Change to read and write scope
      callback: '',
    });
    setGisInited(true);
    maybeEnableButtons();
  };

  const maybeEnableButtons = () => {
    if (gapiInited && gisInited) {
      document.getElementById('authorize_button').style.visibility = 'visible';
    }
  };

  const handleAuthClick = () => {
    window.tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      document.getElementById('signout_button').style.visibility = 'visible';
      document.getElementById('authorize_button').innerText = 'Refresh';
      await listUpcomingEvents();
    };

    if (window.gapi.client.getToken() === null) {
      window.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      window.tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      document.getElementById('content').innerText = '';
      document.getElementById('authorize_button').innerText = 'Authorize';
      document.getElementById('signout_button').style.visibility = 'hidden';
    }
  };

  const listUpcomingEvents = async () => {
    let response;
    try {
      const request = {
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime',
      };
      response = await window.gapi.client.calendar.events.list(request);
    } catch (err) {
      document.getElementById('content').innerText = err.message;
      return;
    }

    const events = response.result.items;
    if (!events || events.length === 0) {
      document.getElementById('content').innerText = 'No events found.';
      return;
    }
    setEvents(events);
  };

 /*  const formattedStartDateTime = new Date(startDateTime).toISOString();
const formattedEndDateTime = new Date(endDateTime).toISOString(); */
const createEvent = async () => {
  // Ensure startDateTime and endDateTime are not empty
  if (!startDateTime || !endDateTime) {
    console.error('Start date/time and end date/time are required.');
    return;
  }

  // Parse the input values as Date objects
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  // Check if the parsed dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('Invalid date/time format.');
    return;
  }

  // Format the dates according to ISO 8601
  const formattedStartDateTime = startDate.toISOString();
  const formattedEndDateTime = endDate.toISOString();

  // Create the event object with formatted dates and times
  const event = {
    'summary': summary,
    'description': description,
    'location': location,
    'start': {
      'dateTime': formattedStartDateTime,
    },
    'end': {
      'dateTime': formattedEndDateTime,
    },
  };

  try {
    const response = await window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event,
    });
    console.log('Event created:', response.result);
    await listUpcomingEvents();
  } catch (err) {
    console.error('Error creating event:', err);
  }
};

  

  return (
    <div>
      <p>Google Calendar API Quickstart</p>

      <button id="authorize_button" onClick={handleAuthClick}>Authorize</button>
      <button id="signout_button" onClick={handleSignoutClick} style={{ visibility: 'hidden' }}>Sign Out</button>

      <div>
        <input type="text" placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} />
        <input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} />
        <button onClick={createEvent}>Create Event</button>
      </div>

      <pre id="content" style={{ whiteSpace: 'pre-wrap' }}>
        {events.map((event, index) => (
          <div key={index}>
            {event.summary} ({event.start.dateTime || event.start.date})
          </div>
        ))}
      </pre>
    </div>
  );
};

export default GoogleCalendarQuickstart;
