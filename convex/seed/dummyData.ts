/**
 * Dummy data for seeding 100 spaces with threads
 */

export interface SpaceDefinition {
  name: string;
  tags: string[];
  color: string;
  category: string;
}

export interface ThreadTemplate {
  description: string;
}

// Thread templates by category - 10 per category type
export const THREAD_TEMPLATES: Record<string, ThreadTemplate[]> = {
  "mental-health": [
    { description: "First time here - nervous but hopeful" },
    { description: "Looking for accountability partners" },
    { description: "Coping strategies that actually work?" },
    { description: "Bad day today, need to vent" },
    { description: "Small wins thread - celebrate progress" },
    { description: "Resources and book recommendations" },
    { description: "How do you explain this to family?" },
    { description: "Medication experiences and questions" },
    { description: "Daily check-in thread" },
    { description: "Finding the right therapist" },
  ],
  "tragedy-trauma": [
    { description: "Healing isn't linear - sharing my journey" },
    { description: "Anniversary coming up, need support" },
    { description: "How do you handle triggers?" },
    { description: "Building a new normal" },
    { description: "Support for supporters" },
    { description: "Finding meaning after loss" },
    { description: "Legal and practical resources" },
    { description: "When people don't understand" },
    { description: "Self-care isn't selfish" },
    { description: "Connecting with others who get it" },
  ],
  "underprivileged": [
    { description: "Resource sharing thread" },
    { description: "Navigating the system together" },
    { description: "Success stories and hope" },
    { description: "Job opportunities and leads" },
    { description: "Free/low-cost services in your area" },
    { description: "Advocacy and making our voices heard" },
    { description: "Tips for stretching limited resources" },
    { description: "Education and skill-building" },
    { description: "Community support network" },
    { description: "Breaking the cycle" },
  ],
  "identity-community": [
    { description: "Safe space to be yourself" },
    { description: "Coming out stories and support" },
    { description: "Dealing with discrimination" },
    { description: "Finding your community" },
    { description: "Cultural pride and heritage" },
    { description: "Intersectionality discussions" },
    { description: "Ally resources and education" },
    { description: "Dating and relationships" },
    { description: "Family acceptance journey" },
    { description: "Celebrating who we are" },
  ],
  "health-conditions": [
    { description: "Newly diagnosed - what now?" },
    { description: "Treatment options and experiences" },
    { description: "Managing symptoms day-to-day" },
    { description: "Doctor communication tips" },
    { description: "Insurance and financial help" },
    { description: "Exercise and nutrition support" },
    { description: "Mental health with chronic illness" },
    { description: "Caregiver support corner" },
    { description: "Research and clinical trials" },
    { description: "Living well despite challenges" },
  ],
};

// Dummy user data for seeding
export const DUMMY_USERS = [
  { clerkId: "dummy_user_001", email: "alex.rivera@example.com", name: "Alex Rivera" },
  { clerkId: "dummy_user_002", email: "jordan.chen@example.com", name: "Jordan Chen" },
  { clerkId: "dummy_user_003", email: "taylor.okonkwo@example.com", name: "Taylor Okonkwo" },
  { clerkId: "dummy_user_004", email: "sam.patel@example.com", name: "Sam Patel" },
  { clerkId: "dummy_user_005", email: "morgan.williams@example.com", name: "Morgan Williams" },
  { clerkId: "dummy_user_006", email: "casey.nguyen@example.com", name: "Casey Nguyen" },
  { clerkId: "dummy_user_007", email: "jamie.garcia@example.com", name: "Jamie Garcia" },
  { clerkId: "dummy_user_008", email: "riley.johnson@example.com", name: "Riley Johnson" },
  { clerkId: "dummy_user_009", email: "avery.kim@example.com", name: "Avery Kim" },
  { clerkId: "dummy_user_010", email: "drew.martinez@example.com", name: "Drew Martinez" },
  { clerkId: "dummy_user_011", email: "quinn.thompson@example.com", name: "Quinn Thompson" },
  { clerkId: "dummy_user_012", email: "skyler.brown@example.com", name: "Skyler Brown" },
  { clerkId: "dummy_user_013", email: "phoenix.davis@example.com", name: "Phoenix Davis" },
  { clerkId: "dummy_user_014", email: "sage.wilson@example.com", name: "Sage Wilson" },
  { clerkId: "dummy_user_015", email: "river.lee@example.com", name: "River Lee" },
  { clerkId: "dummy_user_016", email: "rowan.taylor@example.com", name: "Rowan Taylor" },
  { clerkId: "dummy_user_017", email: "blake.anderson@example.com", name: "Blake Anderson" },
  { clerkId: "dummy_user_018", email: "reese.thomas@example.com", name: "Reese Thomas" },
  { clerkId: "dummy_user_019", email: "finley.jackson@example.com", name: "Finley Jackson" },
  { clerkId: "dummy_user_020", email: "emery.white@example.com", name: "Emery White" },
];

// 100 Spaces organized by category
export const SEED_SPACES: SpaceDefinition[] = [
  // ============================================
  // MENTAL HEALTH (25 spaces) - Purple/Indigo tones
  // ============================================
  {
    name: "Depression",
    tags: ["mental-health", "mood", "support", "therapy", "wellness"],
    color: "#6366f1",
    category: "mental-health",
  },
  {
    name: "Anxiety",
    tags: ["mental-health", "stress", "panic", "coping", "wellness"],
    color: "#818cf8",
    category: "mental-health",
  },
  {
    name: "PTSD",
    tags: ["mental-health", "trauma", "recovery", "healing", "support"],
    color: "#a855f7",
    category: "mental-health",
  },
  {
    name: "OCD",
    tags: ["mental-health", "obsessive", "compulsive", "therapy", "coping"],
    color: "#8b5cf6",
    category: "mental-health",
  },
  {
    name: "Bipolar",
    tags: ["mental-health", "mood", "bipolar", "stability", "medication"],
    color: "#7c3aed",
    category: "mental-health",
  },
  {
    name: "Schizophrenia",
    tags: ["mental-health", "psychosis", "support", "therapy", "community"],
    color: "#6d28d9",
    category: "mental-health",
  },
  {
    name: "Eating Disorders",
    tags: ["mental-health", "eating", "recovery", "body-image", "support"],
    color: "#5b21b6",
    category: "mental-health",
  },
  {
    name: "ADHD",
    tags: ["mental-health", "adhd", "focus", "neurodivergent", "coping"],
    color: "#4c1d95",
    category: "mental-health",
  },
  {
    name: "Autism Spectrum",
    tags: ["mental-health", "autism", "neurodivergent", "support", "community"],
    color: "#7e22ce",
    category: "mental-health",
  },
  {
    name: "Borderline Personality",
    tags: ["mental-health", "bpd", "emotional", "therapy", "dbt"],
    color: "#9333ea",
    category: "mental-health",
  },
  {
    name: "Addiction Recovery",
    tags: ["mental-health", "addiction", "recovery", "sobriety", "support"],
    color: "#a78bfa",
    category: "mental-health",
  },
  {
    name: "Self-Harm Recovery",
    tags: ["mental-health", "self-harm", "recovery", "healing", "support"],
    color: "#c4b5fd",
    category: "mental-health",
  },
  {
    name: "Phobias",
    tags: ["mental-health", "phobia", "fear", "anxiety", "therapy"],
    color: "#ddd6fe",
    category: "mental-health",
  },
  {
    name: "Social Anxiety",
    tags: ["mental-health", "social", "anxiety", "isolation", "coping"],
    color: "#e9d5ff",
    category: "mental-health",
  },
  {
    name: "Panic Disorder",
    tags: ["mental-health", "panic", "attacks", "anxiety", "breathing"],
    color: "#f3e8ff",
    category: "mental-health",
  },
  {
    name: "Dissociative Disorders",
    tags: ["mental-health", "dissociation", "identity", "trauma", "therapy"],
    color: "#c084fc",
    category: "mental-health",
  },
  {
    name: "Grief Counseling",
    tags: ["mental-health", "grief", "loss", "bereavement", "healing"],
    color: "#d8b4fe",
    category: "mental-health",
  },
  {
    name: "Chronic Pain",
    tags: ["mental-health", "chronic", "pain", "management", "support"],
    color: "#e879f9",
    category: "mental-health",
  },
  {
    name: "Insomnia",
    tags: ["mental-health", "sleep", "insomnia", "fatigue", "wellness"],
    color: "#f0abfc",
    category: "mental-health",
  },
  {
    name: "Body Dysmorphia",
    tags: ["mental-health", "body-image", "dysmorphia", "self-esteem", "therapy"],
    color: "#f5d0fe",
    category: "mental-health",
  },
  {
    name: "Hoarding",
    tags: ["mental-health", "hoarding", "organization", "therapy", "support"],
    color: "#a855f7",
    category: "mental-health",
  },
  {
    name: "Anger Management",
    tags: ["mental-health", "anger", "management", "coping", "therapy"],
    color: "#8b5cf6",
    category: "mental-health",
  },
  {
    name: "Emotional Dysregulation",
    tags: ["mental-health", "emotions", "regulation", "dbt", "coping"],
    color: "#7c3aed",
    category: "mental-health",
  },
  {
    name: "Codependency",
    tags: ["mental-health", "codependency", "relationships", "boundaries", "healing"],
    color: "#6d28d9",
    category: "mental-health",
  },
  {
    name: "Burnout",
    tags: ["mental-health", "burnout", "stress", "work", "recovery"],
    color: "#5b21b6",
    category: "mental-health",
  },

  // ============================================
  // TRAGEDY/TRAUMA (20 spaces) - Deep red/maroon tones
  // ============================================
  {
    name: "Domestic Violence Survivors",
    tags: ["tragedy", "domestic-violence", "survivors", "safety", "healing"],
    color: "#dc2626",
    category: "tragedy-trauma",
  },
  {
    name: "Sexual Assault Survivors",
    tags: ["tragedy", "sexual-assault", "survivors", "healing", "support"],
    color: "#b91c1c",
    category: "tragedy-trauma",
  },
  {
    name: "Suicide Loss",
    tags: ["tragedy", "suicide", "loss", "grief", "support"],
    color: "#991b1b",
    category: "tragedy-trauma",
  },
  {
    name: "Child Abuse Survivors",
    tags: ["tragedy", "child-abuse", "survivors", "healing", "therapy"],
    color: "#7f1d1d",
    category: "tragedy-trauma",
  },
  {
    name: "War Veterans",
    tags: ["tragedy", "veterans", "war", "ptsd", "support"],
    color: "#ef4444",
    category: "tragedy-trauma",
  },
  {
    name: "Natural Disaster Survivors",
    tags: ["tragedy", "disaster", "survivors", "recovery", "community"],
    color: "#f87171",
    category: "tragedy-trauma",
  },
  {
    name: "Crime Victims",
    tags: ["tragedy", "crime", "victims", "justice", "healing"],
    color: "#fca5a5",
    category: "tragedy-trauma",
  },
  {
    name: "Accident Survivors",
    tags: ["tragedy", "accident", "survivors", "recovery", "support"],
    color: "#fecaca",
    category: "tragedy-trauma",
  },
  {
    name: "Medical Trauma",
    tags: ["tragedy", "medical", "trauma", "healthcare", "healing"],
    color: "#fee2e2",
    category: "tragedy-trauma",
  },
  {
    name: "Bullying Survivors",
    tags: ["tragedy", "bullying", "survivors", "school", "healing"],
    color: "#e11d48",
    category: "tragedy-trauma",
  },
  {
    name: "Workplace Harassment",
    tags: ["tragedy", "workplace", "harassment", "support", "legal"],
    color: "#be123c",
    category: "tragedy-trauma",
  },
  {
    name: "Cult Survivors",
    tags: ["tragedy", "cult", "survivors", "recovery", "support"],
    color: "#9f1239",
    category: "tragedy-trauma",
  },
  {
    name: "Human Trafficking Survivors",
    tags: ["tragedy", "trafficking", "survivors", "freedom", "healing"],
    color: "#881337",
    category: "tragedy-trauma",
  },
  {
    name: "Police Brutality",
    tags: ["tragedy", "police", "brutality", "justice", "advocacy"],
    color: "#fb7185",
    category: "tragedy-trauma",
  },
  {
    name: "Mass Shooting Survivors",
    tags: ["tragedy", "shooting", "survivors", "trauma", "community"],
    color: "#fda4af",
    category: "tragedy-trauma",
  },
  {
    name: "Wrongful Conviction",
    tags: ["tragedy", "wrongful", "conviction", "justice", "exoneration"],
    color: "#fecdd3",
    category: "tragedy-trauma",
  },
  {
    name: "Foster Care Alumni",
    tags: ["tragedy", "foster-care", "alumni", "support", "community"],
    color: "#ffe4e6",
    category: "tragedy-trauma",
  },
  {
    name: "Parental Abandonment",
    tags: ["tragedy", "abandonment", "parents", "healing", "support"],
    color: "#f43f5e",
    category: "tragedy-trauma",
  },
  {
    name: "Miscarriage & Infant Loss",
    tags: ["tragedy", "miscarriage", "infant-loss", "grief", "healing"],
    color: "#fb923c",
    category: "tragedy-trauma",
  },
  {
    name: "Terminal Illness",
    tags: ["tragedy", "terminal", "illness", "support", "end-of-life"],
    color: "#fdba74",
    category: "tragedy-trauma",
  },

  // ============================================
  // UNDERPRIVILEGED GROUPS (25 spaces) - Amber/orange tones
  // ============================================
  {
    name: "Homeless Support",
    tags: ["underprivileged", "homeless", "housing", "resources", "support"],
    color: "#f59e0b",
    category: "underprivileged",
  },
  {
    name: "Refugee Community",
    tags: ["underprivileged", "refugee", "immigration", "resettlement", "community"],
    color: "#d97706",
    category: "underprivileged",
  },
  {
    name: "Immigrants",
    tags: ["underprivileged", "immigrants", "citizenship", "community", "resources"],
    color: "#b45309",
    category: "underprivileged",
  },
  {
    name: "Low-Income Families",
    tags: ["underprivileged", "low-income", "families", "resources", "support"],
    color: "#92400e",
    category: "underprivileged",
  },
  {
    name: "Food Insecurity",
    tags: ["underprivileged", "food", "hunger", "resources", "community"],
    color: "#78350f",
    category: "underprivileged",
  },
  {
    name: "Single Parents",
    tags: ["underprivileged", "single-parent", "parenting", "support", "resources"],
    color: "#fbbf24",
    category: "underprivileged",
  },
  {
    name: "Disabled Community",
    tags: ["underprivileged", "disability", "accessibility", "advocacy", "support"],
    color: "#fcd34d",
    category: "underprivileged",
  },
  {
    name: "Deaf & Hard of Hearing",
    tags: ["underprivileged", "deaf", "hearing", "asl", "community"],
    color: "#fde047",
    category: "underprivileged",
  },
  {
    name: "Blind & Visually Impaired",
    tags: ["underprivileged", "blind", "visual", "accessibility", "support"],
    color: "#fef08a",
    category: "underprivileged",
  },
  {
    name: "Chronic Illness",
    tags: ["underprivileged", "chronic", "illness", "support", "community"],
    color: "#fef9c3",
    category: "underprivileged",
  },
  {
    name: "Rare Disease",
    tags: ["underprivileged", "rare-disease", "research", "support", "advocacy"],
    color: "#eab308",
    category: "underprivileged",
  },
  {
    name: "Elderly Care",
    tags: ["underprivileged", "elderly", "aging", "caregiving", "support"],
    color: "#ca8a04",
    category: "underprivileged",
  },
  {
    name: "Rural Communities",
    tags: ["underprivileged", "rural", "isolation", "resources", "community"],
    color: "#a16207",
    category: "underprivileged",
  },
  {
    name: "Indigenous Peoples",
    tags: ["underprivileged", "indigenous", "native", "culture", "advocacy"],
    color: "#854d0e",
    category: "underprivileged",
  },
  {
    name: "Formerly Incarcerated",
    tags: ["underprivileged", "incarcerated", "reentry", "support", "employment"],
    color: "#713f12",
    category: "underprivileged",
  },
  {
    name: "Undocumented",
    tags: ["underprivileged", "undocumented", "immigration", "rights", "support"],
    color: "#facc15",
    category: "underprivileged",
  },
  {
    name: "Youth in Foster Care",
    tags: ["underprivileged", "foster-care", "youth", "support", "resources"],
    color: "#fde68a",
    category: "underprivileged",
  },
  {
    name: "Runaways",
    tags: ["underprivileged", "runaway", "youth", "safety", "resources"],
    color: "#fef3c7",
    category: "underprivileged",
  },
  {
    name: "Sex Workers",
    tags: ["underprivileged", "sex-work", "safety", "rights", "support"],
    color: "#fffbeb",
    category: "underprivileged",
  },
  {
    name: "Gig Economy Workers",
    tags: ["underprivileged", "gig-economy", "workers", "rights", "support"],
    color: "#f97316",
    category: "underprivileged",
  },
  {
    name: "Unemployed",
    tags: ["underprivileged", "unemployed", "job-search", "support", "resources"],
    color: "#ea580c",
    category: "underprivileged",
  },
  {
    name: "Underemployed",
    tags: ["underprivileged", "underemployed", "career", "skills", "support"],
    color: "#c2410c",
    category: "underprivileged",
  },
  {
    name: "Uninsured",
    tags: ["underprivileged", "uninsured", "healthcare", "resources", "support"],
    color: "#9a3412",
    category: "underprivileged",
  },
  {
    name: "Housing Insecurity",
    tags: ["underprivileged", "housing", "rent", "eviction", "resources"],
    color: "#7c2d12",
    category: "underprivileged",
  },
  {
    name: "Educational Disadvantaged",
    tags: ["underprivileged", "education", "access", "first-gen", "support"],
    color: "#fb923c",
    category: "underprivileged",
  },

  // ============================================
  // IDENTITY/COMMUNITY (20 spaces) - Pink/rose tones
  // ============================================
  {
    name: "LGBTQ+ General",
    tags: ["identity", "lgbtq", "pride", "community", "support"],
    color: "#ec4899",
    category: "identity-community",
  },
  {
    name: "Trans Support",
    tags: ["identity", "transgender", "transition", "support", "community"],
    color: "#db2777",
    category: "identity-community",
  },
  {
    name: "Non-Binary",
    tags: ["identity", "nonbinary", "gender", "community", "support"],
    color: "#be185d",
    category: "identity-community",
  },
  {
    name: "Bisexual",
    tags: ["identity", "bisexual", "lgbtq", "community", "support"],
    color: "#9d174d",
    category: "identity-community",
  },
  {
    name: "Asexual",
    tags: ["identity", "asexual", "ace", "community", "support"],
    color: "#831843",
    category: "identity-community",
  },
  {
    name: "Intersex",
    tags: ["identity", "intersex", "community", "support", "awareness"],
    color: "#f472b6",
    category: "identity-community",
  },
  {
    name: "Queer Youth",
    tags: ["identity", "lgbtq", "youth", "support", "community"],
    color: "#f9a8d4",
    category: "identity-community",
  },
  {
    name: "LGBTQ+ Seniors",
    tags: ["identity", "lgbtq", "seniors", "aging", "community"],
    color: "#fbcfe8",
    category: "identity-community",
  },
  {
    name: "LGBTQ+ Parents",
    tags: ["identity", "lgbtq", "parents", "family", "community"],
    color: "#fce7f3",
    category: "identity-community",
  },
  {
    name: "Coming Out Support",
    tags: ["identity", "coming-out", "lgbtq", "support", "family"],
    color: "#fdf2f8",
    category: "identity-community",
  },
  {
    name: "People of Color",
    tags: ["identity", "poc", "race", "community", "support"],
    color: "#d946ef",
    category: "identity-community",
  },
  {
    name: "Black Community",
    tags: ["identity", "black", "community", "culture", "support"],
    color: "#c026d3",
    category: "identity-community",
  },
  {
    name: "Asian Community",
    tags: ["identity", "asian", "community", "culture", "support"],
    color: "#a21caf",
    category: "identity-community",
  },
  {
    name: "Latinx Community",
    tags: ["identity", "latinx", "hispanic", "culture", "community"],
    color: "#86198f",
    category: "identity-community",
  },
  {
    name: "Native American",
    tags: ["identity", "native", "indigenous", "culture", "community"],
    color: "#701a75",
    category: "identity-community",
  },
  {
    name: "Mixed Race",
    tags: ["identity", "mixed-race", "multiracial", "community", "support"],
    color: "#e879f9",
    category: "identity-community",
  },
  {
    name: "Immigrants of Color",
    tags: ["identity", "immigrants", "poc", "community", "support"],
    color: "#f0abfc",
    category: "identity-community",
  },
  {
    name: "Religious Minorities",
    tags: ["identity", "religion", "minority", "faith", "community"],
    color: "#f5d0fe",
    category: "identity-community",
  },
  {
    name: "Atheists & Agnostics",
    tags: ["identity", "atheist", "agnostic", "secular", "community"],
    color: "#fae8ff",
    category: "identity-community",
  },
  {
    name: "Interfaith",
    tags: ["identity", "interfaith", "religion", "dialogue", "community"],
    color: "#fdf4ff",
    category: "identity-community",
  },

  // ============================================
  // HEALTH CONDITIONS (10 spaces) - Teal/cyan tones
  // ============================================
  {
    name: "Cancer Support",
    tags: ["health", "cancer", "oncology", "treatment", "support"],
    color: "#14b8a6",
    category: "health-conditions",
  },
  {
    name: "HIV/AIDS",
    tags: ["health", "hiv", "aids", "treatment", "community"],
    color: "#0d9488",
    category: "health-conditions",
  },
  {
    name: "Diabetes",
    tags: ["health", "diabetes", "blood-sugar", "management", "support"],
    color: "#0f766e",
    category: "health-conditions",
  },
  {
    name: "Heart Disease",
    tags: ["health", "heart", "cardiovascular", "recovery", "support"],
    color: "#115e59",
    category: "health-conditions",
  },
  {
    name: "Autoimmune Disorders",
    tags: ["health", "autoimmune", "chronic", "treatment", "support"],
    color: "#134e4a",
    category: "health-conditions",
  },
  {
    name: "Neurological Conditions",
    tags: ["health", "neurological", "brain", "treatment", "support"],
    color: "#2dd4bf",
    category: "health-conditions",
  },
  {
    name: "Respiratory Illness",
    tags: ["health", "respiratory", "lungs", "breathing", "support"],
    color: "#5eead4",
    category: "health-conditions",
  },
  {
    name: "Kidney Disease",
    tags: ["health", "kidney", "dialysis", "transplant", "support"],
    color: "#99f6e4",
    category: "health-conditions",
  },
  {
    name: "Liver Disease",
    tags: ["health", "liver", "hepatitis", "treatment", "support"],
    color: "#ccfbf1",
    category: "health-conditions",
  },
  {
    name: "Genetic Disorders",
    tags: ["health", "genetic", "hereditary", "rare", "support"],
    color: "#f0fdfa",
    category: "health-conditions",
  },
];

/**
 * Get thread templates for a space based on its category
 */
export function getThreadTemplatesForCategory(category: string): ThreadTemplate[] {
  return THREAD_TEMPLATES[category] || THREAD_TEMPLATES["mental-health"];
}
