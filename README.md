# אישור הגעה - בר מצווה 🎉

A Hebrew web application for managing RSVPs to a Bar Mitzva event.

## Features

- **RSVP Form** – Guests can confirm attendance and specify the number of guests
- **Event Details** – Date, location, and navigation link to Google Maps
- **Admin Dashboard** – View all responses with summary statistics
- **Persistent Storage** – All responses stored in SQLite database
- **Hebrew RTL** – Fully right-to-left Hebrew interface
- **Mobile Responsive** – Works on all device sizes

## Event Details

- **Date:** March 26, 2026
- **Location:** בית הכנסת בכרמית, דרורית 42, מיתר

## Getting Started

### Prerequisites

- Node.js 18+ 

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The app will start on `http://localhost:3000`.

- **RSVP Page:** `http://localhost:3000/`
- **Admin Dashboard:** `http://localhost:3000/admin.html`

### Running Tests

```bash
npm test
```

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)
- **Frontend:** Vanilla HTML, CSS, JavaScript