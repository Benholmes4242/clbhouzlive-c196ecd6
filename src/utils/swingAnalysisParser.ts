import { SwingAnalysisSummary, SwingPhase, SwingDrill } from '@/components/swing-review/SwingReview';

// Inline type — was previously in @/types/swing (decommissioned)
interface VisualPlanItem {
  frameHint: "P1"|"P2"|"P3"|"P4"|"P5";
  caption: string;
  overlays: {
    lines?: Array<{x1:number,y1:number,x2:number,y2:number,label?:string}>;
    angles?: Array<{cx:number,cy:number,a:number,b:number,label?:string}>;
    keypoints?: Array<{x:number,y:number,label:string,conf?:number}>;
    notes?: string;
  };
}

// Parse markdown content to extract structured swing analysis data
export function parseSwingAnalysis(content: string, videoUrl?: string): {
  summary: SwingAnalysisSummary;
  phases: SwingPhase[];
  priorityFix: { title: string; why: string; howToFeel: string; microTask: string; };
  drills: SwingDrill[];
  visualPlan?: VisualPlanItem[];
} | null {
  try {
    // Extract club from content
    const clubMatch = content.match(/(?:Using|With|Driver|Iron|Wedge|Putter)\s+([A-Za-z0-9\-\s]+)/i);
    const club = clubMatch?.[1]?.trim() || 'Club';

    // Extract date (current date if not found)
    const date = new Date().toLocaleDateString();

    // Extract strengths (look for positive language)
    const strengths = extractStrengths(content);
    
    // Extract priority fix (look for main issues)
    const priorityFix = extractPriorityFix(content);
    
    // Extract recommended drill
    const recommendedDrill = extractRecommendedDrill(content);
    
    // Extract verdict (summary statement)
    const verdict = extractVerdict(content);

    // Generate phases from content analysis
    const phases = generatePhases(content);

    // Generate drills
    const drills = generateDrills(content, recommendedDrill);
    
    // Extract visual plan if present
    const visualPlan = extractVisualPlan(content);

    const summary: SwingAnalysisSummary = {
      club,
      date,
      strengths,
      priorityFix: priorityFix.title,
      recommendedDrill,
      verdict
    };

    return {
      summary,
      phases,
      priorityFix,
      drills,
      visualPlan
    };
  } catch (error) {
    console.error('Failed to parse swing analysis:', error);
    return null;
  }
}

function extractStrengths(content: string): string[] {
  const strengths: string[] = [];
  
  // Look for positive indicators
  const positivePatterns = [
    /good\s+([^.]+)/gi,
    /excellent\s+([^.]+)/gi,
    /strong\s+([^.]+)/gi,
    /nice\s+([^.]+)/gi,
    /solid\s+([^.]+)/gi,
    /consistent\s+([^.]+)/gi
  ];

  positivePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const strength = match.replace(/good|excellent|strong|nice|solid|consistent/gi, '').trim();
        if (strength && strength.length > 3) {
          strengths.push(capitalizeFirst(strength.split(' ').slice(0, 2).join(' ')));
        }
      });
    }
  });

  // Default strengths if none found
  if (strengths.length === 0) {
    strengths.push('Balance', 'Posture');
  }

  return strengths.slice(0, 3); // Max 3 strengths
}

function extractPriorityFix(content: string): { title: string; why: string; howToFeel: string; microTask: string; } {
  // Look for common swing issues
  const issuePatterns = [
    /elbow.*(?:flying|chicken wing|too high)/i,
    /wrist.*(?:cupped|flat|position)/i,
    /hip.*(?:slide|sway|rotation)/i,
    /shoulder.*(?:dip|tilt|alignment)/i,
    /weight.*(?:transfer|shift|distribution)/i,
    /tempo.*(?:rush|quick|slow)/i
  ];

  let title = 'Swing plane consistency';
  let why = 'Consistent swing plane leads to better ball striking';
  let howToFeel = 'Feel the club staying on the same path';
  let microTask = 'Hit 10 balls focusing on swing plane';

  // Try to extract specific issue
  for (const pattern of issuePatterns) {
    const match = content.match(pattern);
    if (match) {
      title = match[0];
      why = `${title} affects ball flight and consistency`;
      howToFeel = `Focus on controlling ${title.toLowerCase()}`;
      microTask = `Hit 15 balls focusing on ${title.toLowerCase()}`;
      break;
    }
  }

  return { title, why, howToFeel, microTask };
}

function extractRecommendedDrill(content: string): string {
  const drillPatterns = [
    /step.*through/i,
    /alignment.*drill/i,
    /tempo.*drill/i,
    /weight.*shift/i,
    /impact.*drill/i
  ];

  for (const pattern of drillPatterns) {
    const match = content.match(pattern);
    if (match) {
      return capitalizeFirst(match[0]);
    }
  }

  return 'Step-through drill';
}

function extractVerdict(content: string): string {
  // Look for summary statements
  const sentences = content.split('.').map(s => s.trim());
  
  // Find sentences with positive and improvement language
  const verdictSentence = sentences.find(sentence => 
    sentence.includes('overall') || 
    sentence.includes('athletic') ||
    sentence.includes('motion') ||
    (sentence.includes('good') && sentence.includes('but'))
  );

  return verdictSentence || 'Solid foundation with room for improvement in key areas.';
}

function generatePhases(content: string): SwingPhase[] {
  const phaseNames = [
    'Setup',
    'Takeaway', 
    'Backswing',
    'Top',
    'Downswing',
    'Impact',
    'Follow-through'
  ];

  return phaseNames.map((name, index) => ({
    id: `phase-${index}`,
    name,
    timestamp: (index / (phaseNames.length - 1)) * 3, // Assume 3 second swing
    status: determinePhaseStatus(name, content),
    observation: generatePhaseObservation(name, content),
    strength: Math.random() > 0.6 ? generatePhaseStrength(name) : undefined,
    tip: Math.random() > 0.4 ? generatePhaseTip(name) : undefined
  }));
}

function determinePhaseStatus(phase: string, content: string): 'strong' | 'tip' | 'fix' {
  const lowerContent = content.toLowerCase();
  const lowerPhase = phase.toLowerCase();
  
  if (lowerContent.includes(`good ${lowerPhase}`) || lowerContent.includes(`strong ${lowerPhase}`)) {
    return 'strong';
  } else if (lowerContent.includes(`issue`) || lowerContent.includes(`problem`)) {
    return 'fix';
  }
  
  return 'tip';
}

function generatePhaseObservation(phase: string, content: string): string {
  const observations = {
    'Setup': 'Posture and alignment at address',
    'Takeaway': 'Initial club movement away from ball',
    'Backswing': 'Loading and coiling motion',
    'Top': 'Position at the peak of backswing',
    'Downswing': 'Transition and acceleration phase',
    'Impact': 'Contact with the ball',
    'Follow-through': 'Completion of swing motion'
  };
  
  return observations[phase as keyof typeof observations] || 'Phase analysis';
}

function generatePhaseStrength(phase: string): string {
  const strengths = {
    'Setup': 'Balanced posture',
    'Takeaway': 'Smooth initiation',
    'Backswing': 'Good shoulder turn',
    'Top': 'Solid position',
    'Downswing': 'Good sequence',
    'Impact': 'Square contact',
    'Follow-through': 'Complete finish'
  };
  
  return strengths[phase as keyof typeof strengths] || 'Good execution';
}

function generatePhaseTip(phase: string): string {
  const tips = {
    'Setup': 'Keep weight centered over feet',
    'Takeaway': 'Start with shoulders, not hands',
    'Backswing': 'Turn around spine angle',
    'Top': 'Maintain wrist position',
    'Downswing': 'Lead with lower body',
    'Impact': 'Hit down on the ball',
    'Follow-through': 'Finish with balance'
  };
  
  return tips[phase as keyof typeof tips] || 'Focus on timing';
}

function generateDrills(content: string, recommendedDrill: string): SwingDrill[] {
  return [{
    id: 'primary-drill',
    name: recommendedDrill,
    description: `Practice drill to improve your swing`,
    steps: [
      'Set up in your normal address position',
      'Focus on the key movement pattern',
      'Practice the motion slowly first'
    ],
    targetFeel: 'Smooth, controlled movement',
    reps: '3 sets × 10 reps'
  }];
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Extract visual plan for keyframe annotation
function extractVisualPlan(content: string): VisualPlanItem[] {
  const visualPlan: VisualPlanItem[] = [];
  
  // Look for visual plan section in the content
  const visualPlanMatch = content.match(/visual.?plan[:\s]*\n([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  
  if (visualPlanMatch) {
    const planContent = visualPlanMatch[1];
    
    // Parse individual keyframes
    const frameMatches = planContent.match(/P[1-9][:\s]+(.*?)(?=P[1-9]|$)/gi);
    
    if (frameMatches) {
      frameMatches.forEach(match => {
        const phaseMatch = match.match(/P([1-9])/);
        const captionMatch = match.match(/:\s*(.+?)(?:\n|$)/);
        
        if (phaseMatch && captionMatch) {
          const phase = `P${phaseMatch[1]}` as VisualPlanItem['frameHint'];
          const caption = captionMatch[1].trim();
          
          // Generate basic overlays based on phase
          const overlays = generateBasicOverlays(phase);
          
          visualPlan.push({
            frameHint: phase,
            caption,
            overlays
          });
        }
      });
    }
  }
  
  // If no visual plan found, generate default plan
  if (visualPlan.length === 0) {
    const defaultPhases: VisualPlanItem['frameHint'][] = ['P1', 'P2', 'P4'];
    
    defaultPhases.forEach(phase => {
      visualPlan.push({
        frameHint: phase,
        caption: getDefaultCaption(phase),
        overlays: generateBasicOverlays(phase)
      });
    });
  }
  
  return visualPlan;
}

function generateBasicOverlays(phase: VisualPlanItem['frameHint']) {
  const overlays: any = {};
  
  switch (phase) {
    case 'P1': // Setup
      overlays.keypoints = [
        { x: 0.5, y: 0.7, label: 'Ball Position' },
        { x: 0.45, y: 0.4, label: 'Head' }
      ];
      overlays.lines = [
        { x1: 0.45, y1: 0.2, x2: 0.45, y2: 0.8, label: 'Spine Angle' }
      ];
      break;
      
    case 'P2': // Backswing Top
      overlays.keypoints = [
        { x: 0.4, y: 0.15, label: 'Club Position' },
        { x: 0.45, y: 0.4, label: 'Head' }
      ];
      overlays.lines = [
        { x1: 0.45, y1: 0.4, x2: 0.4, y2: 0.15, label: 'Swing Plane' }
      ];
      break;
      
    case 'P4': // Impact
      overlays.keypoints = [
        { x: 0.5, y: 0.7, label: 'Impact Zone' },
        { x: 0.45, y: 0.4, label: 'Head' }
      ];
      overlays.lines = [
        { x1: 0.4, y1: 0.6, x2: 0.6, y2: 0.6, label: 'Impact Line' }
      ];
      break;
      
    default:
      overlays.keypoints = [
        { x: 0.45, y: 0.4, label: 'Reference Point' }
      ];
  }
  
  return overlays;
}

function getDefaultCaption(phase: VisualPlanItem['frameHint']): string {
  const captions = {
    P1: 'Setup position with proper alignment',
    P2: 'Backswing top position',
    P3: 'Transition and sequence',
    P4: 'Impact position and ball contact',
    P5: 'Follow through and finish'
  };
  
  return captions[phase] || 'Key swing position';
}