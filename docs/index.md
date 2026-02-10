---
title: FitAI API Reference

language_tabs:
  - shell
  - javascript

toc_footers:
  - <a href='#'>Sign Up for a Developer Key</a>
  - <a href='https://github.com/slatedocs/slate'>Documentation Powered by Slate</a>

includes:
  - errors

search: true

code_clipboard: true

meta:
  - name: description
    content: Documentation for the FitAI Backend API
---

# Introduction

Welcome to the FitAI API! This documentation provides everything you need to integrate with our AI-powered fitness training platform.

# Authentication

> To authorize, use this code:

```javascript
const token = 'YOUR_JWT_TOKEN';
const response = await fetch('https://api.fitai.com/v1/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

```shell
# With shell, you can just pass the correct header with each request
curl "https://api.fitai.com/v1/users/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

FitAI uses JWT tokens to allow access to the API.

# Auth Module

## Send Verification Code

```javascript
const response = await fetch('https://api.fitai.com/v1/auth/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '912345678',
    countryCode: '+351'
  })
});
```

```shell
curl -X POST "https://api.fitai.com/v1/auth/send-code" \
  -H "Content-Type: application/json" \
  -d '{"phone": "912345678", "countryCode": "+351"}'
```

### HTTP Request

`POST https://api.fitai.com/v1/auth/send-code`

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
phone | | User phone number (without country code)
countryCode | +351 | Country code (e Portugal: +351, Brazil: +55)

## Verify Code

```javascript
const response = await fetch('https://api.fitai.com/v1/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '912345678',
    code: '123456'
  })
});
```

### HTTP Request

`POST https://api.fitai.com/v1/auth/verify-code`

# User Module

## Get Profile

### HTTP Request

`GET https://api.fitai.com/v1/users/profile`
