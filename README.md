# <img src="frontend/public/aila-icon.png" width="28" vertical-align="middle"> Aila: Your Trip Assistant

## What is Aila?
<img src="frontend/public/aila-relax.png" width="200" align="right" />

The name **Aila** originates from the Filipino word **Agila** (Eagle). Just like the eagle, Aila provides a "bird's-eye view" of your travel, helping you soar through your daily commutes with intelligence, safety, and ease.

Aila is an intelligent trip assistant designed to track your journeys, optimize your routes, and keep your loved ones in the loop. Whether you are driving through the city or navigating public transit, Aila turns every trip into a stress-free experience through real-time AI assistance and effortless sharing.

---

## Core Features

### Intelligent Route Optimization
Find the best path for your destination instantly. Aila calculates routes for both **Driving** and **Public Transit**, providing accurate fare and fuel estimations so you know your budget before you step out the door.

### Meet Aila, Your Trip Assistant
<img src="frontend/public/aila-icon.png" width="30" align="left" /> **Aila isn't just an app—it’s your trip assistant.** Eliminate travel anxiety by asking her questions like *"Asan na ba tayo?"* to get live, contextual updates on your location, ETA, and journey progress.

### Seamless Background Tracking
Start your trip and let Aila handle the rest. Focus on the journey while she automatically tracks your exact route, distance in kilometers, and duration in minutes in the background with 100% accuracy.

### Effortless Trip Sharing
Keep your loved ones in the loop. Share your live location, chosen route, and exact ETA with friends and family in just one tap for ultimate peace of mind. 

---

## How it Works

1.  **Find your route:** Choose between driving or transit. Aila calculates the best path and shows you the details, including commute fares and estimated costs.
2.  **Start, Chat & Share:** Begin tracking your journey. Talk to Aila along the way for live updates, and easily share your live trip details with friends so they know you are safe.
3.  **Arrive securely:** Once you arrive, your completed journey is securely logged into your history for easy reference.

---

## Tech Stack

### Frontend
* **React**: Core framework for a fast, reactive user interface.
* **Tailwind CSS**: Modern styling with a "Sora" and "Raleway" font pairing.
* **Lucide Icons**: Clean, professional iconography for travel metrics.
* **Context API**: Global state management for user sessions and auth.

### Backend
* **FastAPI**: High-performance Python framework for API logic.
* **SQLAlchemy**: Robust ORM for managing travel data.
* **SQLite**: Reliable local storage for trip logs and user profiles.
* **JWT Authentication**: Secure, token-based user security.

### AI Engine
* **Google Gemini**: Powering the trip assistant for real-time contextual updates.

---

## Installation & Setup

### Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v14 or higher)
* **Python** (v3.8 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/rshdgvn/Aila.git
cd Aila
```

### 2. Backend Setup (FastAPI)
Open a terminal and navigate to the `backend` directory to set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required Python dependencies
pip install -r requirements.txt

# Set up environment variables
# Copy the example env file and update it with your actual keys
cp .env.example .env

# Start the FastAPI server
uvicorn app.main:app --reload
```
*The backend server will typically run on `http://localhost:8000`.*

### 3. Frontend Setup (React + TypeScript)
Open a **new, separate terminal**, and navigate to the `frontend` directory.

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
*The frontend application will start and can be viewed in your browser.*
