"""
ALUMNI MANAGEMENT SYSTEM - API DOCUMENTATION
==============================================

Complete REST API reference for the Alumni Management System.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Response Format

#### Success Response (200, 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "error_code",
  "message": "Error description",
  "details": { ... }
}
```

---

## Authentication Endpoints

### 1. Send OTP

**Endpoint:** `POST /auth/send-otp`

**Description:** Send OTP to user's email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to email"
  }
}
```

**Errors:**
- `400` - Invalid email format
- `429` - Too many OTP requests

---

### 2. Verify OTP

**Endpoint:** `POST /auth/verify-otp`

**Description:** Verify OTP and receive verification token

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "verification_token": "token_string",
    "expires_in": 259200
  }
}
```

**Errors:**
- `400` - Invalid OTP
- `401` - OTP expired or max attempts exceeded
- `404` - User not found

---

### 3. Set Password

**Endpoint:** `POST /auth/set-password`

**Description:** Set password for new user (after OTP verification)

**Request:**
```json
{
  "verification_token": "token_string",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password set successfully"
  }
}
```

**Errors:**
- `400` - Passwords don't match or too weak
- `401` - Invalid verification token

---

### 4. Login

**Endpoint:** `POST /auth/login`

**Description:** Login with email and password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "access_token_jwt",
    "refresh_token": "refresh_token_jwt",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "User Name",
      "role": "alumni"
    }
  }
}
```

**Errors:**
- `400` - Invalid credentials
- `401` - Account locked (too many attempts)
- `404` - User not found

---

### 5. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Description:** Get new access token using refresh token

**Request:**
```json
{
  "refresh_token": "refresh_token_jwt"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token_jwt",
    "refresh_token": "new_refresh_token_jwt"
  }
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### 6. Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Description:** Request password reset

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Reset link sent to email"
  }
}
```

---

### 7. Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** Reset password with reset token

**Request:**
```json
{
  "reset_token": "token_string",
  "password": "NewPassword123!",
  "password_confirm": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

---

### 8. Get Current User

**Endpoint:** `GET /auth/me`

**Description:** Get current authenticated user

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "User Name",
    "role": "alumni",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

---

## Alumni Endpoints

### 1. Create Alumni Profile

**Endpoint:** `POST /alumni/create`

**Permission:** `admin`

**Request:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "batch": "2020",
  "department": "Computer Science",
  "phone": "+1234567890",
  "privacy_level": "alumni_only"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "batch": "2020",
    "department": "Computer Science"
  }
}
```

---

### 2. Search Alumni Directory

**Endpoint:** `GET /alumni/directory`

**Query Parameters:**
- `search` (string) - Search by name, email, department
- `batch` (string) - Filter by batch
- `department` (string) - Filter by department
- `page` (integer) - Page number (default: 1)
- `per_page` (integer) - Results per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "batch": "2020",
        "department": "Computer Science",
        "phone": "+1234567890",
        "privacy_level": "alumni_only"
      }
    ],
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

---

### 3. Get Alumni Profile

**Endpoint:** `GET /alumni/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "batch": "2020",
    "department": "Computer Science",
    "phone": "+1234567890",
    "current_company": "Tech Corp",
    "job_title": "Senior Developer",
    "bio": "Lorem ipsum...",
    "privacy_level": "alumni_only"
  }
}
```

---

### 4. Get Current User Profile

**Endpoint:** `GET /alumni/profile/me`

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):** Same as GET /alumni/{id}

---

### 5. Update Current User Profile

**Endpoint:** `PUT /alumni/profile/me`

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "full_name": "John Doe Updated",
  "phone": "+9876543210",
  "current_company": "New Company",
  "job_title": "Lead Developer",
  "bio": "Updated bio...",
  "privacy_level": "public"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe Updated"
  }
}
```

---

## Events Endpoints

### 1. Create Event

**Endpoint:** `POST /events/`

**Permission:** `event_manager, admin`

**Request:**
```json
{
  "title": "Annual Reunion 2024",
  "description": "Join us for our annual alumni reunion...",
  "event_type": "reunion",
  "date": "2024-06-15",
  "time": "18:00",
  "location": "Main Hall",
  "capacity": 500,
  "is_paid": true,
  "price": 25.00,
  "image_url": "https://..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Annual Reunion 2024",
    "date": "2024-06-15",
    "rsvp_count": 0
  }
}
```

---

### 2. List Events

**Endpoint:** `GET /events/`

**Query Parameters:**
- `event_type` (string) - reunion, workshop, webinar...
- `upcoming` (boolean) - Only upcoming events
- `page` (integer)
- `per_page` (integer)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Annual Reunion 2024",
        "date": "2024-06-15",
        "location": "Main Hall",
        "rsvp_count": 150,
        "capacity": 500
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 20
  }
}
```

---

### 3. Get Event Detail

**Endpoint:** `GET /events/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Annual Reunion 2024",
    "description": "...",
    "event_type": "reunion",
    "date": "2024-06-15",
    "time": "18:00",
    "location": "Main Hall",
    "capacity": 500,
    "rsvp_count": 150,
    "is_paid": true,
    "price": 25.00,
    "image_url": "https://...",
    "rsvps": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "user_name": "John Doe",
        "status": "confirmed",
        "checked_in": false
      }
    ]
  }
}
```

---

### 4. RSVP for Event

**Endpoint:** `POST /events/{id}/rsvp`

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "status": "confirmed",
  "meal_preference": "vegetarian",
  "plus_ones": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "uuid",
    "status": "confirmed",
    "message": "RSVP recorded successfully"
  }
}
```

---

## Jobs Endpoints

### 1. Create Job

**Endpoint:** `POST /jobs/`

**Permission:** `admin`

**Request:**
```json
{
  "title": "Senior Developer",
  "company": "Tech Corp",
  "description": "Join our team as a Senior Developer...",
  "location": "New York, NY",
  "job_type": "full-time",
  "salary_range": "$100k - $150k",
  "skills_required": ["Python", "React", "PostgreSQL"],
  "experience_years": 3,
  "deadline": "2024-02-28",
  "external_url": "https://..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Developer",
    "company": "Tech Corp",
    "applications_count": 0
  }
}
```

---

### 2. List Jobs

**Endpoint:** `GET /jobs/`

**Query Parameters:**
- `search` (string) - Search title, company
- `location` (string) - Filter by location
- `job_type` (string) - full-time, part-time, contract...
- `experience_years` (integer) - Minimum years
- `page` (integer)
- `per_page` (integer)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Senior Developer",
        "company": "Tech Corp",
        "location": "New York, NY",
        "salary_range": "$100k - $150k",
        "posted_on": "2024-01-15",
        "applications_count": 15
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 20
  }
}
```

---

### 3. Apply for Job

**Endpoint:** `POST /jobs/{id}/apply`

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "cover_letter": "I am very interested in this position...",
  "resume_url": "https://..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "application_id": "uuid",
    "message": "Application submitted successfully"
  }
}
```

---

## Notices Endpoints

### 1. Get Notice Categories

**Endpoint:** `GET /notices/categories`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Announcements",
      "description": "Important announcements"
    },
    {
      "id": "uuid",
      "name": "News",
      "description": "Alumni news and updates"
    }
  ]
}
```

---

### 2. List Notices

**Endpoint:** `GET /notices/`

**Query Parameters:**
- `category_id` (uuid) - Filter by category
- `search` (string) - Search title
- `page` (integer)
- `per_page` (integer)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Annual Fund Campaign",
        "category": "Announcements",
        "published_on": "2024-01-15",
        "views": 150
      }
    ],
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

---

### 3. Get Notice Detail

**Endpoint:** `GET /notices/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Annual Fund Campaign",
    "category": "Announcements",
    "content": "We are launching our annual fund campaign...",
    "image_url": "https://...",
    "published_on": "2024-01-15",
    "views": 150,
    "expires_on": "2024-12-31"
  }
}
```

---

## Elections Endpoints

### 1. Create Election

**Endpoint:** `POST /elections/`

**Permission:** `election_manager, admin`

**Request:**
```json
{
  "title": "2024 Alumni Board Election",
  "description": "Vote for your alumni board members...",
  "start_date": "2024-06-01",
  "end_date": "2024-06-15",
  "voting_mode": "anonymous"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "2024 Alumni Board Election"
  }
}
```

---

### 2. Add Position

**Endpoint:** `POST /elections/{election_id}/positions`

**Request:**
```json
{
  "title": "President",
  "description": "Lead the alumni organization",
  "positions_available": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "President",
    "positions_available": 1
  }
}
```

---

### 3. Add Candidate

**Endpoint:** `POST /elections/{position_id}/candidates`

**Request:**
```json
{
  "user_id": "uuid",
  "manifesto": "My vision is to strengthen alumni connections..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "candidate_name": "John Doe",
    "position": "President"
  }
}
```

---

### 4. Cast Vote

**Endpoint:** `POST /elections/{election_id}/vote`

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "position_id": "uuid",
  "candidate_id": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Vote recorded successfully"
  }
}
```

**Errors:**
- `400` - Already voted for this position
- `403` - Election not active
- `404` - Position or candidate not found

---

### 5. Get Election Results

**Endpoint:** `GET /elections/{id}/results`

**Query Parameters:**
- `position_id` (uuid) - Filter by position

**Response (200):**
```json
{
  "success": true,
  "data": {
    "election_id": "uuid",
    "title": "2024 Alumni Board Election",
    "positions": [
      {
        "position_id": "uuid",
        "position_title": "President",
        "positions_available": 1,
        "total_votes": 350,
        "candidates": [
          {
            "candidate_id": "uuid",
            "name": "John Doe",
            "votes": 180,
            "percentage": 51.4
          },
          {
            "candidate_id": "uuid",
            "name": "Jane Smith",
            "votes": 170,
            "percentage": 48.6
          }
        ]
      }
    ]
  }
}
```

---

## CMS Endpoints

### 1. Get Page

**Endpoint:** `GET /cms/pages/{slug}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "About Us",
    "slug": "about-us",
    "content": "Our alumni association was founded in...",
    "is_published": true,
    "created_at": "2024-01-01"
  }
}
```

---

### 2. Create/Update Slider

**Endpoint:** `POST /cms/sliders`

**Permission:** `admin`

**Request:**
```json
{
  "title": "Annual Reunion",
  "description": "Join us for our annual reunion...",
  "image_url": "https://...",
  "link_url": "https://",
  "order": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Annual Reunion"
  }
}
```

---

### 3. Get Committee

**Endpoint:** `GET /cms/committee`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "position": "President",
      "photo_url": "https://...",
      "bio": "..."
    }
  ]
}
```

---

### 4. Get Gallery

**Endpoint:** `GET /cms/gallery`

**Query Parameters:**
- `page` (integer)
- `per_page` (integer)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Annual Reunion 2023",
        "image_url": "https://...",
        "uploaded_on": "2023-06-15"
      }
    ],
    "total": 50,
    "page": 1
  }
}
```

---

### 5. Get Contact Info

**Endpoint:** `GET /cms/contact`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "+1 (555) 123-4567",
    "email": "contact@alumni.com",
    "address": "123 Main St, City, State 12345",
    "office_hours": "Mon-Fri 9AM-5PM"
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `ACCOUNT_LOCKED` | 403 | Too many failed login attempts |
| `INVALID_OTP` | 400 | OTP is invalid or expired |
| `EMAIL_ALREADY_EXISTS` | 409 | Email already registered |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required role |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_VOTE` | 400 | User already voted for this position |
| `ELECTION_NOT_ACTIVE` | 403 | Voting period not active |
| `CAPACITY_EXCEEDED` | 400 | Event at capacity |
| `ALREADY_APPLIED` | 400 | User already applied to job |

---

## Rate Limiting

- OTP sending: 5 per hour per email
- Login attempts: 5 per 15 minutes per account
- API calls: 1000 per hour per user

---

## webhooks (Optional)

POST `/webhooks/events` - Triggered when events occur
```json
{
  "event_type": "election.vote_cast",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { ... }
}
```

---

## Testing

### Using cURL

```bash
# Send OTP
curl -X POST "http://localhost:8000/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get current user
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Using Postman

1. Import collection from `postman_collection.json`
2. Set environment: `base_url=http://localhost:8000/api/v1`
3. Run requests in order

---

## Version

API Version: v1
Last Updated: 2024-01-15

For more information, visit http://localhost:8000/docs
