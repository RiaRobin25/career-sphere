CareerSphere – Job Portal System

Project Overview

CareerSphere is a full-stack web-based Job Portal System developed as part of the ICT Academy of Kerala Internship Program. The application is designed to bridge the gap between job seekers and recruiters by providing a centralized platform for recruitment and job management activities.

The system enables candidates to create profiles, upload resumes, search for jobs, save preferred opportunities, apply for positions, and track their application status. Recruiters can create and manage job postings, review applications, schedule interviews, and communicate with candidates through a real-time chat system.

CareerSphere aims to simplify and digitize the recruitment process while providing an efficient, user-friendly, and scalable platform for both job seekers and employers.

---

Problem Statement

Traditional recruitment processes often involve manual handling of resumes, delayed communication, inefficient application tracking, and difficulty in matching candidates with suitable job opportunities.

CareerSphere addresses these challenges by providing:

- A centralized recruitment platform
- Digital resume management
- Real-time communication
- ATS (Applicant Tracking System) based application tracking
- Efficient job search and filtering
- Interview scheduling and management

---

Objectives

The primary objectives of the project are:

- To develop a web-based recruitment platform.
- To provide secure user authentication and authorization.
- To allow recruiters to manage job postings efficiently.
- To enable candidates to search and apply for jobs online.
- To provide resume upload functionality.
- To implement ATS-based application tracking.
- To facilitate recruiter-candidate communication.
- To improve recruitment efficiency through automation.
- To gain practical experience in Full Stack Web Development.

---

Key Features

Candidate Features

User Registration and Login

Candidates can create accounts and securely log in to access platform services.

User Profile Management

Users can update personal information, skills, education details, and professional qualifications.

Resume Upload

Candidates can upload their resumes using Multer for easy access during job applications.

Job Search and Filtering

Users can search jobs based on:

- Job Title
- Company Name
- Location
- Job Type
- Experience Level

Saved Jobs

Candidates can save interesting job opportunities and revisit them later.

Job Applications

Users can directly apply for available job openings through the platform.

ATS Tracking

Candidates can track their application status, including:

- Applied
- Under Review
- Shortlisted
- Interview Scheduled
- Selected
- Rejected

Real-Time Chat

Candidates can communicate directly with recruiters through instant messaging.

---

Recruiter Features

Recruiter Registration and Login

Recruiters can create dedicated accounts to manage recruitment activities.

Job Posting Management

Recruiters can:

- Create jobs
- Update job details
- Delete job postings
- View posted jobs

Candidate Management

Recruiters can review applications and candidate profiles.

ATS Tracking System

Recruiters can update and monitor application progress throughout the hiring process.

Interview Scheduling

Recruiters can schedule interviews and manage interview information.

Real-Time Communication

Recruiters can interact with candidates through a chat interface powered by Socket.IO.

---

Admin Features

User Management

Manage registered candidates and recruiters.

Job Management

Monitor and manage all job postings available on the platform.

Application Monitoring

Track recruitment activities and application progress.

System Administration

Maintain overall system performance and functionality.

---

System Architecture

The CareerSphere platform follows a modern Full Stack Architecture.

Frontend (React.js)

↓

Axios API Requests

↓

Backend (Node.js + Express.js)

↓

MongoDB Database

↓

Socket.IO Real-Time Communication

---

Technology Stack

Frontend Technologies

- React.js
- Vite
- React Router DOM
- Axios
- CSS

Backend Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer
- Socket.IO

Development Tools

- Visual Studio Code
- Postman
- GitHub
- MongoDB Atlas

---

Database Design

The application uses MongoDB as the primary database.

Major Collections:

Users

Stores candidate and recruiter information.

Jobs

Stores job postings created by recruiters.

Applications

Stores job application details.

Interviews

Stores interview schedules and status.

Messages

Stores real-time chat messages.

Saved Jobs

Stores jobs bookmarked by candidates.

---

Project Structure

career-sphere/

├── frontend/

│ ├── src/

│ ├── public/

│ └── package.json

│

├── backend/

│ ├── models/

│ ├── routes/

│ ├── controllers/

│ ├── middleware/

│ └── server.js

│

├── package.json

├── package-lock.json

└── README.md

---

Installation Guide

Step 1: Clone Repository

git clone https://github.com/RiaRobin25/career-sphere.git

Step 2: Navigate to Project Directory

cd career-sphere

Step 3: Install Dependencies

npm install

Step 4: Configure Environment Variables

Create a .env file inside the backend folder and configure:

- MongoDB Connection String
- JWT Secret
- Port Number

Step 5: Run Backend Server

npm start

or

npm run server

Step 6: Run Frontend

npm run dev

---

Project Outcomes

The CareerSphere Job Portal System successfully provides:

- Efficient job management
- Secure authentication
- Resume management
- ATS-based application tracking
- Real-time recruiter-candidate communication
- Interview scheduling
- Advanced job search functionality

The project demonstrates practical implementation of Full Stack Web Development concepts and modern recruitment management solutions.

---

Future Enhancements

Potential improvements include:

- AI-Based Resume Screening
- Job Recommendation System
- Email Notifications
- Video Interview Integration
- Resume Analytics
- Advanced Reporting Dashboard
- Mobile Application Development

---

Team Members

1. Ria Robin
2. T V Theertha Krishnan
3. Ananya K C
4. Helan Al Lissy

---

Institution

Yuvakshetra Institute of Management Studies

---

Internship Program

ICT Academy of Kerala

Full Stack Application Development using ReactJS

---



---

Conclusion

CareerSphere is a comprehensive recruitment platform that simplifies the hiring process for recruiters and job seekers. By integrating modern web technologies, ATS tracking, resume management, interview scheduling, and real-time communication, the system provides a complete solution for digital recruitment management.
