# main.py - FastAPI Backend with Pydantic AI

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from dotenv import load_dotenv
import PyPDF2
import io
from typing import List, Optional
import logging
from pydantic_ai.models.openai import OpenAIModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(title="Smart Study Buddy API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class ExplanationRequest(BaseModel):
    document_content: str
    question: str

class ExplanationResponse(BaseModel):
    explanation: str
    key_concepts: List[str] = Field(default_factory=list)
    examples: List[str] = Field(default_factory=list)

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizRequest(BaseModel):
    document_content: str
    num_questions: int = 5

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class DailyPlan(BaseModel):
    day: str
    tasks: List[str]

class StudyPlanRequest(BaseModel):
    document_content: str
    days_until_exam: int = 7

class StudyPlanResponse(BaseModel):
    daily_plan: List[DailyPlan]

# Initialize Pydantic AI Agent with free model from OpenRouter
# You can use any free model from https://openrouter.ai/models?order=pricing-low-to-high
# Example: google/gemini-flash-1.5-8b (free) or meta-llama/llama-3.2-3b-instruct:free

# By not passing an api_key or other client parameters, pydantic-ai will instruct
# the `openai` library to initialize its own client. The `openai` library
# will automatically look for and use the OPENAI_API_KEY and OPENAI_BASE_URL
# environment variables, which should be set in the .env file.
model = OpenAIModel(
    model_name="meta-llama/llama-3.2-3b-instruct:free",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Create specialized agents for different tasks
explanation_agent = Agent(
    model,
    system_prompt="""You are a helpful study buddy AI assistant. Your job is to explain concepts 
    from study materials in a clear, simple, and engaging way. Break down complex topics into 
    digestible parts. Provide relevant examples and highlight key concepts. Always be encouraging 
    and supportive."""
)

quiz_agent = Agent(
    model,
    system_prompt="""You are a quiz generator AI. Create thoughtful multiple-choice questions 
    based on study material. Each question should have 4 options with one correct answer. 
    Provide clear explanations for correct answers. Questions should test understanding, not 
    just memorization."""
)

study_plan_agent = Agent(
    model,
    system_prompt="""You are a study planner AI. Create realistic, achievable daily study plans 
    based on the content provided. Break down topics into manageable daily tasks. Include review 
    sessions and practice time. Be encouraging and realistic about time commitments."""
)

# Helper function to extract text from PDF
def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Smart Study Buddy API",
        "version": "1.0.0",
        "endpoints": ["/upload", "/explain", "/generate-quiz", "/study-plan"]
    }

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process study material (PDF or TXT)"""
    try:
        content = await file.read()
        
        if file.content_type == "application/pdf":
            text = extract_text_from_pdf(content)
        elif file.content_type.startswith("text/"):
            text = content.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        if not text or len(text) < 50:
            raise HTTPException(status_code=400, detail="Document is too short or empty")
        
        # Limit content size (first 10000 chars for demo)
        text = text[:10000]
        
        logger.info(f"Document uploaded successfully: {file.filename}")
        return {
            "success": True,
            "filename": file.filename,
            "content": text,
            "length": len(text)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process document")

@app.post("/explain", response_model=ExplanationResponse)
async def explain_concept(request: ExplanationRequest):
    """Get AI explanation for a question about the study material"""
    try:
        prompt = f"""Based on the following study material:

{request.document_content[:3000]}

Answer this question in a clear, simple way: {request.question}

Provide:
1. A detailed explanation
2. Key concepts (3-5 important terms or ideas)
3. 2-3 practical examples to illustrate the concept
"""
        
        result = await explanation_agent.run(prompt, result_type=ExplanationResponse)
        logger.info(f"Explanation generated for question: {request.question[:50]}")
        return result.data
    
    except Exception as e:
        logger.error(f"Explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate explanation")

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """Generate a practice quiz from study material"""
    try:
        prompt = f"""Based on the following study material:

{request.document_content[:3000]}

Create {request.num_questions} multiple-choice questions that test understanding.

For each question:
- Write a clear question
- Provide exactly 4 options (A, B, C, D)
- Indicate the correct answer
- Provide a brief explanation of why it's correct

Questions should cover different aspects of the material and test comprehension, not just memorization.
"""
        
        result = await quiz_agent.run(prompt, result_type=QuizResponse)
        logger.info(f"Quiz generated with {len(result.data.questions)} questions")
        return result.data
    
    except Exception as e:
        logger.error(f"Quiz generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz")

@app.post("/study-plan", response_model=StudyPlanResponse)
async def create_study_plan(request: StudyPlanRequest):
    """Create a personalized study plan"""
    try:
        prompt = f"""Based on the following study material:

{request.document_content[:3000]}

Create a {request.days_until_exam}-day study plan to master this content.

For each day:
- Provide the day label (e.g., "Day 1", "Day 2")
- List 3-5 specific tasks/topics to study
- Include time for practice and review
- Make it realistic and achievable

The plan should be progressive, building from basics to advanced concepts.
"""
        
        result = await study_plan_agent.run(prompt, result_type=StudyPlanResponse)
        logger.info(f"Study plan generated for {request.days_until_exam} days")
        return result.data
    
    except Exception as e:
        logger.error(f"Study plan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate study plan")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Smart Study Buddy API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
