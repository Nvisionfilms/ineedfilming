// CRM Utility Functions for Lead Scoring and Pipeline Management

export interface QualificationCriteria {
  hasBudget: boolean;
  budgetRange?: string;
  isDecisionMaker: boolean;
  decisionMakerName?: string;
  hasTimeline: boolean;
  timelineMonths?: number;
  needsConfirmed: boolean;
  needsDescription?: string;
  competitorsMentioned?: string[];
  painPoints?: string[];
  qualificationNotes?: string;
}

export interface LeadScoreFactors {
  // Demographics (30 points)
  budgetSize: number;        // 0-10
  companySize: number;       // 0-10
  industry: number;          // 0-10
  
  // Engagement (40 points)
  emailResponsiveness: number;  // 0-10
  meetingsAttended: number;     // 0-10
  websiteActivity: number;      // 0-10
  responseTime: number;         // 0-10
  
  // Intent (30 points)
  timelineUrgency: number;   // 0-10
  projectSize: number;       // 0-10
  referralSource: number;    // 0-10
}

export function calculateQualificationScore(criteria: QualificationCriteria): number {
  let score = 0;
  
  // Budget (25 points)
  if (criteria.hasBudget) score += 25;
  
  // Authority (25 points)
  if (criteria.isDecisionMaker) score += 25;
  
  // Need (25 points)
  if (criteria.needsConfirmed) score += 25;
  
  // Timeline (25 points)
  if (criteria.hasTimeline) {
    if (criteria.timelineMonths && criteria.timelineMonths <= 1) score += 25;
    else if (criteria.timelineMonths && criteria.timelineMonths <= 3) score += 20;
    else if (criteria.timelineMonths && criteria.timelineMonths <= 6) score += 15;
    else score += 10;
  }
  
  return score;
}

export function calculateLeadScore(factors: LeadScoreFactors): number {
  const demographics = factors.budgetSize + factors.companySize + factors.industry;
  const engagement = factors.emailResponsiveness + factors.meetingsAttended + 
                    factors.websiteActivity + factors.responseTime;
  const intent = factors.timelineUrgency + factors.projectSize + factors.referralSource;
  
  return demographics + engagement + intent;
}

export function getLeadGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

export function getLeadGradeColor(grade: 'A' | 'B' | 'C' | 'D'): string {
  switch (grade) {
    case 'A': return 'bg-red-500 text-white'; // Hot
    case 'B': return 'bg-orange-500 text-white'; // Warm
    case 'C': return 'bg-blue-500 text-white'; // Cold
    case 'D': return 'bg-gray-500 text-white'; // Ice cold
  }
}

export function getLeadGradeIcon(grade: 'A' | 'B' | 'C' | 'D'): string {
  switch (grade) {
    case 'A': return '🔥';
    case 'B': return '⭐';
    case 'C': return '📊';
    case 'D': return '❄️';
  }
}

export function getStageProbability(stage: string): number {
  const probabilities: Record<string, number> = {
    'new_lead': 0.10,
    'qualified': 0.25,
    'proposal': 0.50,
    'negotiation': 0.75,
    'won': 1.00,
    'lost': 0.00,
  };
  return probabilities[stage] || 0;
}

export function calculateWeightedValue(budgetMax: number, stage: string): number {
  return budgetMax * getStageProbability(stage);
}

export function getDaysInStageColor(days: number): string {
  if (days > 14) return 'text-red-500';
  if (days > 7) return 'text-orange-500';
  return 'text-green-500';
}

export function getStaleOpportunityThreshold(stage: string): number {
  const thresholds: Record<string, number> = {
    'new_lead': 3,      // 3 days
    'qualified': 7,     // 1 week
    'proposal': 10,     // 10 days
    'negotiation': 5,   // 5 days
  };
  return thresholds[stage] || 14;
}

export function isOpportunityStale(lastActivity: Date, stage: string): boolean {
  const threshold = getStaleOpportunityThreshold(stage);
  const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceActivity > threshold;
}

export function generateFollowUpMessage(stage: string, daysInactive: number): string {
  const messages: Record<string, string> = {
    'new_lead': `New lead has been inactive for ${daysInactive} days. Schedule a discovery call to qualify.`,
    'qualified': `Qualified lead waiting ${daysInactive} days. Send proposal or schedule proposal meeting.`,
    'proposal': `Proposal sent ${daysInactive} days ago with no response. Follow up to answer questions.`,
    'negotiation': `Negotiation stalled for ${daysInactive} days. Check in to close the deal or address concerns.`,
  };
  return messages[stage] || `Opportunity inactive for ${daysInactive} days. Follow up required.`;
}

export interface PipelineMetrics {
  totalValue: number;
  weightedValue: number;
  avgDealSize: number;
  conversionRates: {
    leadToQualified: number;
    qualifiedToProposal: number;
    proposalToWon: number;
    overallWinRate: number;
  };
  avgTimeInStage: {
    newLead: number;
    qualified: number;
    proposal: number;
    negotiation: number;
  };
  staleCount: number;
  hotCount: number;
}

export function calculatePipelineMetrics(opportunities: any[]): PipelineMetrics {
  const active = opportunities.filter(o => o.stage !== 'won' && o.stage !== 'lost');
  const won = opportunities.filter(o => o.stage === 'won');
  const lost = opportunities.filter(o => o.stage === 'lost');
  
  const totalValue = active.reduce((sum, o) => sum + (o.budget_max || 0), 0);
  const weightedValue = active.reduce((sum, o) => 
    sum + calculateWeightedValue(o.budget_max || 0, o.stage), 0
  );
  
  const avgDealSize = won.length > 0 
    ? won.reduce((sum, o) => sum + (o.budget_max || 0), 0) / won.length 
    : 0;
  
  // Conversion rates
  const qualified = opportunities.filter(o => ['qualified', 'proposal', 'negotiation', 'won'].includes(o.stage));
  const proposal = opportunities.filter(o => ['proposal', 'negotiation', 'won'].includes(o.stage));
  
  const leadToQualified = opportunities.length > 0 ? (qualified.length / opportunities.length) * 100 : 0;
  const qualifiedToProposal = qualified.length > 0 ? (proposal.length / qualified.length) * 100 : 0;
  const proposalToWon = proposal.length > 0 ? (won.length / proposal.length) * 100 : 0;
  const overallWinRate = (won.length + lost.length) > 0 
    ? (won.length / (won.length + lost.length)) * 100 
    : 0;
  
  // Time in stage averages
  const getAvgDays = (stage: string) => {
    const opps = opportunities.filter(o => o.stage === stage);
    if (opps.length === 0) return 0;
    return opps.reduce((sum, o) => sum + (o.days_in_stage || 0), 0) / opps.length;
  };
  
  const staleCount = active.filter(o => 
    isOpportunityStale(new Date(o.last_activity_at || o.updated_at), o.stage)
  ).length;
  
  const hotCount = active.filter(o => o.lead_grade === 'A').length;
  
  return {
    totalValue,
    weightedValue,
    avgDealSize,
    conversionRates: {
      leadToQualified,
      qualifiedToProposal,
      proposalToWon,
      overallWinRate,
    },
    avgTimeInStage: {
      newLead: getAvgDays('new_lead'),
      qualified: getAvgDays('qualified'),
      proposal: getAvgDays('proposal'),
      negotiation: getAvgDays('negotiation'),
    },
    staleCount,
    hotCount,
  };
}

export interface ForecastData {
  month: string;
  conservative: number;
  likely: number;
  optimistic: number;
}

export function calculateForecast(opportunities: any[], monthsAhead: number = 1): ForecastData {
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsAhead);
  
  const relevantOpps = opportunities.filter(o => {
    if (!o.expected_close_date) return false;
    const closeDate = new Date(o.expected_close_date);
    return closeDate <= targetDate && o.stage !== 'won' && o.stage !== 'lost';
  });
  
  const negotiation = relevantOpps
    .filter(o => o.stage === 'negotiation')
    .reduce((sum, o) => sum + (o.budget_max || 0) * 0.75, 0);
  
  const proposal = relevantOpps
    .filter(o => o.stage === 'proposal')
    .reduce((sum, o) => sum + (o.budget_max || 0) * 0.50, 0);
  
  const qualified = relevantOpps
    .filter(o => o.stage === 'qualified')
    .reduce((sum, o) => sum + (o.budget_max || 0) * 0.25, 0);
  
  return {
    month: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    conservative: negotiation,
    likely: proposal + negotiation,
    optimistic: qualified + proposal + negotiation,
  };
}
