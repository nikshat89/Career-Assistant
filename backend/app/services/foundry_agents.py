# MIT License • Copyright (c) 2026 Pathfinder

import json
import logging
from typing import List, Dict, Optional, AsyncGenerator
from app.services.ai_service_fixed import get_ai_nonstream, get_ai_response

logger = logging.getLogger(__name__)

class FoundryAgent:
    """Base class for Foundry Reasoning Agents."""
    def __init__(self, name: str, role: str, goal: str, backlight: str):
        self.name = name
        self.role = role
        self.goal = goal
        self.backlight = backlight

    async def execute(self, task: str, context: Optional[Dict] = None, profile: Optional[Dict] = None, user_api_key: Optional[str] = None) -> str:
        prompt = f"""
Agent: {self.name}
Role: {self.role}
Goal: {self.goal}
Context: {self.backlight}

Current Task: {task}
Additional Context: {json.dumps(context or {})}

Please provide your expert response for this task.
"""
        # Using the existing AI service to power the agent
        return await get_ai_nonstream([{"role": "user", "content": prompt}], profile=profile, user_api_key=user_api_key)

class PlannerAgent(FoundryAgent):
    def __init__(self):
        super().__init__(
            name="FoundryPlanner",
            role="Strategic Architect",
            goal="Decompose complex user requests into logical, sequential reasoning steps.",
            backlight="You are the orchestrator of a multi-agent system. Your job is to plan how to solve a problem."
        )

    async def plan(self, user_query: str, profile: Optional[Dict] = None, user_api_key: Optional[str] = None) -> List[Dict]:
        task = f"""
User Query: {user_query}

Decompose this request into exactly 3 reasoning steps. 
Respond ONLY with a valid JSON array of objects, where each object has "step_id", "agent_type", and "description".
Agent types: "Researcher", "Analyst", "Coach", "CollegeAdvisor".

Example:
[
  {{"step_id": 1, "agent_type": "Researcher", "description": "Identify market trends for software engineering in 2026."}},
  {{"step_id": 2, "agent_type": "Analyst", "description": "Compare user's current skills with identified trends."}},
  {{"step_id": 3, "agent_type": "Coach", "description": "Create a 6-month skill development roadmap."}}
]
"""
        response = await self.execute(task, profile=profile, user_api_key=user_api_key)
        try:
            # Simple cleaning for JSON
            cleaned = response.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse plan: {e}. Raw: {response}")
            return [
                {"step_id": 1, "agent_type": "Analyst", "description": f"Analyze: {user_query}"}
            ]

class ExpertAgent(FoundryAgent):
    def __init__(self, agent_type: str):
        roles = {
            "Researcher": "Industry Trend Specialist",
            "Analyst": "Career Gap Analyst",
            "Coach": "Professional Development Coach",
            "CollegeAdvisor": "Academic Admissions Specialist"
        }
        goals = {
            "Researcher": "Find and explain the latest industry developments and hiring patterns.",
            "Analyst": "Evaluate professional profiles against industry standards and identify specific gaps.",
            "Coach": "Provide actionable, empathetic, and strategic advice for career growth.",
            "CollegeAdvisor": "Recommend colleges based on academic profile, budget, and career goals, providing detailed insights into admissions and placements."
        }
        super().__init__(
            name=f"Foundry{agent_type}",
            role=roles.get(agent_type, "Expert"),
            goal=goals.get(agent_type, "Provide deep insights."),
            backlight="You are a specialized expert within the Microsoft Foundry Reasoning framework."
        )

class SynthesisAgent(FoundryAgent):
    def __init__(self):
        super().__init__(
            name="FoundrySynthesizer",
            role="Final Advisor",
            goal="Consolidate multiple reasoning steps into a cohesive, high-impact career advice response.",
            backlight="You take the output of multiple specialized agents and create a unified, polished response for the user."
        )

    async def synthesize(self, user_query: str, results: List[Dict], profile: Optional[Dict] = None, user_api_key: Optional[str] = None, context: Optional[Dict] = None) -> AsyncGenerator[str, None]:
        task = f"""
Original User Request: {user_query}

Insights gathered from Reasoning Steps:
{json.dumps(results, indent=2)}

Additional Context (including retrieved data):
{json.dumps(context or {}, indent=2)}

Please provide a final, comprehensive, and polished response to the user. 
Use Markdown formatting, headings, and a professional tone.
If colleges are provided in the context, rank and recommend them based on the user's goals and reasoning results.
"""
        # We use streaming for the final synthesis to give a better user experience
        async for chunk in get_ai_response([{"role": "user", "content": task}], profile=profile, stream=True, user_api_key=user_api_key):
            yield chunk

class FoundryOrchestrator:
    """Orchestrates multi-step reasoning using specialized agents."""
    def __init__(self):
        self.planner = PlannerAgent()
        self.synthesizer = SynthesisAgent()

    async def solve(self, user_query: str, profile: Optional[Dict] = None, user_api_key: Optional[str] = None, context: Optional[Dict] = None) -> AsyncGenerator[str, None]:
        # Step 1: Planning
        yield "data: {\"status\": \"planning\", \"message\": \"Thinking... Decomposing your request into reasoning steps.\"}\n\n"
        plan = await self.planner.plan(user_query, profile, user_api_key)
        
        results = []
        for step in plan:
            agent_type = step.get("agent_type", "Analyst")
            desc = step.get("description", "Analyzing...")
            
            yield f"data: {{\"status\": \"reasoning\", \"step\": {step['step_id']}, \"agent\": \"{agent_type}\", \"message\": \"{desc}\"}}\n\n"
            
            agent = ExpertAgent(agent_type)
            # Combine provided context with reasoning results
            agent_context = (context or {}).copy()
            agent_context["previous_results"] = results
            
            result = await agent.execute(desc, context=agent_context, profile=profile, user_api_key=user_api_key)
            
            # NEW: Yield the result of the agent
            yield f"data: {{\"status\": \"completed_step\", \"step\": {step['step_id']}, \"agent\": \"{agent_type}\", \"result\": {json.dumps(result)}}}\n\n"
            
            results.append({
                "step_id": step["step_id"],
                "agent_type": agent_type,
                "task": desc,
                "result": result
            })

        # Step 2: Synthesis
        yield "data: {\"status\": \"synthesizing\", \"message\": \"Consolidating insights into a final recommendation.\"}\n\n"
        
        # Consolidate all context for synthesis
        final_context = (context or {}).copy()
        final_context["reasoning_results"] = results
        
        async for chunk in self.synthesizer.synthesize(user_query, results, profile, user_api_key, context=final_context):
            if chunk:
                yield f"data: {json.dumps(chunk)}\n\n"
        
        yield "data: [DONE]\n\n"
