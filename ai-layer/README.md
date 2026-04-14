# AI Layer

This folder represents the AI engine integration layer for OK Fashion.

## Purpose
- Face analysis: skin tone, face shape
- Body analysis: body type detection
- Styling generation: personalized outfit suggestions

## Integration Options
1. Python microservice using FastAPI/Flask for CV/ML models.
2. Third-party APIs for vision and recommendation tasks.

## Expected Backend Contract
- POST /api/analyze
  - Input: multipart images
  - Output: analysis + recommendation payload

Current project includes a mock AI service in server/services/aiService.js to keep end-to-end flows operational while real AI services are integrated.
