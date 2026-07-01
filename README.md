# EasyRent

EasyRent is an AI-powered web application that helps users find rental apartments in Tel Aviv by automatically collecting Facebook rental posts and converting them into structured, searchable listings.

Instead of manually browsing multiple Facebook groups, EasyRent continuously gathers rental posts, extracts the relevant apartment details using OpenAI, stores the information in Firebase, and presents it through a user-friendly search interface.

---

## Features

- Scrapes apartment listings from Facebook rental groups
- Extracts structured apartment information using OpenAI
- Removes duplicate listings automatically
- Supports advanced apartment filtering
- Stores listings in Firebase Firestore
- Responsive React web application
- Automatic cleanup of outdated listings

---

## Project Architecture

```
Facebook Groups
        │
        ▼
Playwright Scraper
        │
        ▼
Raw Facebook Posts
        │
        ▼
Python Processing Pipeline
        │
 ├── Text Cleaning
 ├── OpenAI Information Extraction
 ├── Data Validation
 ├── Duplicate Detection
 └── Firestore Upload
        │
        ▼
Firebase Firestore
        │
        ▼
React Frontend
```

---

## Technologies

### Frontend

- React
- React Router
- Firebase Authentication
- Firebase Firestore

### Backend

- Python
- OpenAI API (GPT-4o-mini)
- Firebase Admin SDK
- Google Firestore
- python-dotenv

### Scraping

- Playwright
- Node.js

---

## AI Processing Pipeline

Each Facebook post goes through several processing stages:

1. Facebook boilerplate is removed.
2. OpenAI extracts structured apartment information.
3. Apartment fields are validated and normalized.
4. Neighborhood names are standardized.
5. Duplicate listings are detected using fingerprints.
6. Valid apartments are uploaded to Firestore.
7. Old and irrelevant documents are periodically removed.

---

## Extracted Information

The AI extracts information such as:

- Price
- Number of rooms
- Apartment size
- Address
- Neighborhood
- Floor
- Property type
- Parking
- Elevator
- Balcony
- Safe room
- Pets allowed
- Broker indication
- Availability date
- Rental type
- Contact phone number
- Facebook post URL

---

## Database

The project uses two Firestore collections:

### posts

Stores the raw Facebook posts before processing.

### apartments

Stores the structured apartment listings after AI extraction and validation.

---

## Running the Project

### Backend

```bash
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
npm install
npm start
```

### Scraper

```bash
node scraper.js
```

---

## Project Structure

```
Frontend/
    React Application

Backend/
    cleaning.py
    processor.py
    gpt_extractor.py
    parsing.py
    fingerprint.py
    pruning.py
    firebase.py

Scraper/
    scraper.js
    facebook-func.js
```

---

## Authors

- Shir Segal
- Liri Jacob
- Eliane Szydlo

Final Project – B.Sc. Computer Science
