# VisiCare — Local Development Setup

Follow these steps to run the VisiCare ICU Visitation platform locally.

## Prerequisite: Conda Environment
I've created a conda environment named `visicare` with Python 3.11.9.

## 1. Backend (FastAPI)
```bash
cd backend
conda activate visicare
python run.py
```
*API will be available at http://localhost:8000*

## 2. Frontend (Vite + React)
```bash
cd frontend
npm install  # (Already pre-installed, but stay safe)
npm run dev
```
*App will be available at http://localhost:5173*

## Testing the Hackathon Flow
1. **Nurse View**: Start as "Hospital Staff". Add a patient (John Doe, Bed 7).
2. **Access Code**: Note the 6-digit code shown on the patient card.
3. **Family View**: Open a second tab, select "Family Member".
4. **Link**: Enter the code to connect to the patient.
5. **Visit**: Request a visit slot.
6. **Approve**: Go back to the Nurse tab and click "Approve".
7. **Join**: Click "Join Call" in both tabs to test the Daily.co video room logic.