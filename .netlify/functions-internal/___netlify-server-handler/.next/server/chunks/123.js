exports.id=123,exports.ids=[123],exports.modules={691:(a,b,c)=>{"use strict";c.d(b,{n:()=>s});class d extends Error{constructor(a){super(a),this.name="ConfigError"}}let e=function(){try{return{anthropicApiKey:function(a){if(!a)throw new d("ANTHROPIC_API_KEY is required. Please add your Claude API key to .env.local");if(!a.startsWith("sk-ant-api03-"))throw new d("Invalid ANTHROPIC_API_KEY format. Expected format: sk-ant-api03-...");if(a.length<50)throw new d("ANTHROPIC_API_KEY appears to be incomplete. Please check your API key.");return a}(process.env.ANTHROPIC_API_KEY),nextPublicAppUrl:"http://localhost:3000",nodeEnv:"production"}}catch(a){throw a instanceof d&&(console.error("❌ Configuration Error:",a.message),console.error("\uD83D\uDCA1 Setup Instructions:"),console.error("   1. Copy .env.example to .env.local"),console.error("   2. Add your Anthropic API key from https://console.anthropic.com/"),console.error("   3. Restart the development server")),a}}();class f{constructor(a){this.maxRetries=3,this.timeout=3e4,this.agentName=a}async callLLM(a,b){let{model:c="claude-3-5-sonnet-20241022",maxTokens:d=4e3,temperature:f=.7}=b||{},g={model:c,max_tokens:d,temperature:f,messages:[{role:"user",content:a}]},h=null;for(let a=1;a<=this.maxRetries;a++)try{let a=new AbortController,b=setTimeout(()=>a.abort(),this.timeout),c=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":e.anthropicApiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify(g),signal:a.signal});if(clearTimeout(b),!c.ok){let a=await c.json().catch(()=>({}));throw Error(`API request failed: ${c.status} ${c.statusText} - ${JSON.stringify(a)}`)}let d=await c.json();if(d.content&&d.content[0]&&d.content[0].text)return d.content[0].text;throw Error("Invalid response format from Claude API")}catch(b){if(h=b instanceof Error?b:Error(String(b)),b instanceof Error&&"AbortError"===b.name&&(h=Error(`Request timeout after ${this.timeout}ms`)),console.warn(`${this.agentName} LLM call attempt ${a} failed:`,h.message),a<this.maxRetries){let b=1e3*Math.pow(2,a);await new Promise(a=>setTimeout(a,b))}}throw Error(`${this.agentName} failed after ${this.maxRetries} attempts. Last error: ${h?.message}`)}async callLLMWithFallback(a,b){try{return await this.callLLM(a)}catch(a){return console.error(`${this.agentName} LLM call failed, using fallback:`,a),JSON.stringify(b)}}extractJSONFromResponse(a){try{let b=a.match(/\{[\s\S]*\}/);if(b)return JSON.parse(b[0]);return JSON.parse(a)}catch(a){throw Error(`Failed to extract JSON from response: ${a}`)}}validateRequiredFields(a,b){for(let c of b)if(!a[c])throw Error(`Missing required field: ${c}`)}sanitizeOutput(a){if("string"==typeof a)return a.replace(/<script[^>]*>.*?<\/script>/gi,"").replace(/javascript:/gi,"").replace(/on\w+\s*=/gi,"");if(Array.isArray(a))return a.map(a=>this.sanitizeOutput(a));if("object"==typeof a&&null!==a){let b={};for(let[c,d]of Object.entries(a))b[c]=this.sanitizeOutput(d);return b}return a}async healthCheck(){try{let a=`Respond with exactly this JSON: {"status": "healthy", "agent": "${this.agentName}"}`,b=await this.callLLM(a,{maxTokens:100,temperature:0}),c=this.extractJSONFromResponse(b);return"healthy"===c.status&&c.agent===this.agentName}catch(a){return console.error(`Health check failed for ${this.agentName}:`,a),!1}}logExecution(a,b){console.log(`[${this.agentName}] ${a}`,b?JSON.stringify(b,null,2):"")}getExecutionTimestamp(){return new Date().toISOString()}}class g extends f{async execute(a,b){let c=this.buildPrompt(a);try{let a=await this.callLLM(c);return this.parseResponse(a)}catch(a){throw Error(`Market research failed: ${a}`)}}buildPrompt(a){return`You are a professional market researcher specializing in ${this.getIndustryFromTopic(a.topic)}. 

Conduct comprehensive market research for the following content project:

**Topic:** ${a.topic}
**Target Audience:** ${a.audience}
**Goals:** ${a.goals}
**Content Type:** ${a.contentType}

Please provide detailed market research including:

1. **Industry Overview**: Current state of the industry related to this topic
2. **Market Trends**: Top 5-7 current trends relevant to this topic
3. **Competitor Analysis**: Key competitors and their content strategies
4. **Market Opportunities**: Gaps and opportunities for content positioning
5. **Challenges & Pain Points**: Main challenges the target audience faces
6. **Key Insights**: Actionable insights for content creation
7. **Sources**: Where to find additional information

Format your response as a detailed JSON object with the following structure:
{
  "industry": "industry name",
  "trends": ["trend 1", "trend 2", ...],
  "competitors": ["competitor 1", "competitor 2", ...], 
  "opportunities": ["opportunity 1", "opportunity 2", ...],
  "challenges": ["challenge 1", "challenge 2", ...],
  "keyInsights": ["insight 1", "insight 2", ...],
  "sources": ["source 1", "source 2", ...]
}

Provide professional, actionable insights based on current market conditions.`}getIndustryFromTopic(a){let b=a.toLowerCase();return b.includes("marketing")||b.includes("advertising")?"Digital Marketing":b.includes("tech")||b.includes("software")||b.includes("ai")?"Technology":b.includes("health")||b.includes("medical")?"Healthcare":b.includes("finance")||b.includes("banking")?"Financial Services":b.includes("real estate")||b.includes("property")?"Real Estate":b.includes("education")||b.includes("learning")?"Education":b.includes("retail")||b.includes("ecommerce")?"Retail":b.includes("food")||b.includes("restaurant")?"Food & Beverage":"General Business"}parseResponse(a){try{let b=a.match(/\{[\s\S]*\}/);if(!b)throw Error("No JSON found in response");let c=JSON.parse(b[0]);for(let a of["industry","trends","competitors","opportunities","challenges","keyInsights","sources"])if(!c[a])throw Error(`Missing required field: ${a}`);return c}catch(b){return this.fallbackParse(a)}}fallbackParse(a){return{industry:"Market Research",trends:this.extractListItems(a,"trends"),competitors:this.extractListItems(a,"competitors"),opportunities:this.extractListItems(a,"opportunities"),challenges:this.extractListItems(a,"challenges"),keyInsights:this.extractListItems(a,"insights"),sources:["Market analysis","Industry reports","Competitor research"]}}extractListItems(a,b){let c=a.split("\n"),d=[],e=!1;for(let a of c){if(a.toLowerCase().includes(b)){e=!0;continue}if(e&&(a.startsWith("-")||a.startsWith("*")||a.match(/^\d+\./)))d.push(a.replace(/^[-*\d.\s]+/,"").trim());else if(e&&""===a.trim())break}return d.length>0?d:[`${b} analysis based on topic research`]}async healthCheck(){try{return await this.callLLM("Provide a brief market overview for digital marketing."),!0}catch{return!1}}}class h extends f{constructor(){super("Audience Analyzer")}async execute(a,b){this.logExecution("Starting audience analysis");let c=b.previousOutputs?.["market-researcher"],d=this.buildPrompt(a,c);try{let a=await this.callLLM(d,{maxTokens:4e3,temperature:.6}),b=this.parseResponse(a);return this.logExecution("Audience analysis completed",{personaCount:b.secondaryPersonas.length+1}),b}catch(a){throw this.logExecution("Audience analysis failed",{error:a.message}),Error(`Audience analysis failed: ${a}`)}}buildPrompt(a,b){let c=b?`
Industry Context from Market Research:
- Industry: ${b.industry}
- Key Trends: ${b.trends.join(", ")}
- Market Opportunities: ${b.opportunities.join(", ")}
- Challenges: ${b.challenges.join(", ")}
`:"";return`You are an expert audience researcher and persona developer specializing in ${a.audience} demographics.

Conduct comprehensive audience analysis for the following content project:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
${a.tone?`- Preferred Tone: ${a.tone}`:""}

${c}

Please provide detailed audience analysis including:

1. **Primary Persona Development**:
   - Create a detailed primary persona with name, demographics, psychographics
   - Include pain points, goals, preferred communication channels
   - Specify content preferences and consumption habits

2. **Secondary Personas** (2-3 additional personas):
   - Identify key secondary audience segments
   - Highlight unique characteristics and needs for each

3. **Audience Insights**:
   - Market size and growth potential
   - Engagement patterns and preferences
   - Key factors that drive conversions
   - Content gaps in the market

4. **Strategic Recommendations**:
   - Messaging strategy recommendations
   - Optimal content types and formats
   - Tonal guidance for communication
   - Channel prioritization

Format your response as a detailed JSON object with the following structure:
{
  "primaryPersona": {
    "name": "persona name",
    "demographics": {
      "age": "age range",
      "gender": "gender distribution",
      "income": "income range",
      "education": "education level",
      "location": "geographic focus"
    },
    "psychographics": {
      "values": ["value 1", "value 2", ...],
      "interests": ["interest 1", "interest 2", ...],
      "lifestyle": ["lifestyle 1", "lifestyle 2", ...],
      "attitudes": ["attitude 1", "attitude 2", ...]
    },
    "painPoints": ["pain point 1", "pain point 2", ...],
    "goals": ["goal 1", "goal 2", ...],
    "preferredChannels": ["channel 1", "channel 2", ...],
    "contentPreferences": ["preference 1", "preference 2", ...]
  },
  "secondaryPersonas": [
    {
      "name": "secondary persona name",
      "keyCharacteristics": ["characteristic 1", "characteristic 2", ...],
      "uniqueNeeds": ["need 1", "need 2", ...]
    }
  ],
  "audienceInsights": {
    "size": "market size description",
    "growth": "growth potential",
    "engagement": "engagement patterns",
    "conversionFactors": ["factor 1", "factor 2", ...],
    "contentGaps": ["gap 1", "gap 2", ...]
  },
  "recommendations": {
    "messagingStrategy": ["strategy 1", "strategy 2", ...],
    "contentTypes": ["type 1", "type 2", ...],
    "tonalGuidance": ["tone 1", "tone 2", ...],
    "channelPriority": ["channel 1", "channel 2", ...]
  }
}

Provide actionable, data-driven insights that will guide content creation strategy.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["primaryPersona","secondaryPersonas","audienceInsights","recommendations"]),this.validateRequiredFields(b.primaryPersona,["name","demographics","psychographics","painPoints","goals","preferredChannels","contentPreferences"]),Array.isArray(b.secondaryPersonas)||(b.secondaryPersonas=[]),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}fallbackParse(a){return{primaryPersona:{name:this.extractPersonaName(a)||"Target Customer",demographics:{age:this.extractDemographic(a,"age")||"25-45",gender:this.extractDemographic(a,"gender")||"Mixed",income:this.extractDemographic(a,"income")||"Middle to Upper-Middle Class",education:this.extractDemographic(a,"education")||"College Educated",location:this.extractDemographic(a,"location")||"Urban/Suburban"},psychographics:{values:this.extractListItems(a,"values")||["Quality","Efficiency","Innovation"],interests:this.extractListItems(a,"interests")||["Technology","Business","Growth"],lifestyle:this.extractListItems(a,"lifestyle")||["Busy Professional","Early Adopter"],attitudes:this.extractListItems(a,"attitudes")||["Solution-Oriented","Research-Driven"]},painPoints:this.extractListItems(a,"pain")||["Time Constraints","Information Overload"],goals:this.extractListItems(a,"goals")||["Improve Efficiency","Achieve Success"],preferredChannels:this.extractListItems(a,"channels")||["Email","Social Media","Web"],contentPreferences:this.extractListItems(a,"content")||["How-to Guides","Case Studies"]},secondaryPersonas:[{name:"Secondary Audience",keyCharacteristics:["Emerging Market Segment"],uniqueNeeds:["Specialized Solutions"]}],audienceInsights:{size:"Growing market segment",growth:"Positive growth trajectory",engagement:"High engagement on relevant content",conversionFactors:["Trust","Value Demonstration","Social Proof"],contentGaps:["Educational Content","Industry-Specific Examples"]},recommendations:{messagingStrategy:["Focus on Benefits","Use Clear Language","Include Social Proof"],contentTypes:["Blog Posts","Case Studies","Video Content"],tonalGuidance:["Professional","Helpful","Trustworthy"],channelPriority:["Website","Email","LinkedIn"]}}}extractPersonaName(a){let b=a.match(/name[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:null}extractDemographic(a,b){let c=RegExp(`${b}["']?\\s*:\\s*["']([^"']+)["']`,"i"),d=a.match(c);return d?d[1]:null}extractListItems(a,b){let c=a.split("\n"),d=[],e=!1;for(let a of c){if(a.toLowerCase().includes(b)){e=!0;continue}if(e&&(a.startsWith("-")||a.startsWith("*")||a.match(/^\d+\./)))d.push(a.replace(/^[-*\d.\s]+/,"").trim());else if(e&&""===a.trim())break}return d}}class i extends f{constructor(){super("Content Strategist")}async execute(a,b){this.logExecution("Starting content strategy development");let c=b.previousOutputs?.["market-researcher"],d=b.previousOutputs?.["audience-analyzer"],e=this.buildPrompt(a,c,d);try{let a=await this.callLLM(e,{maxTokens:4e3,temperature:.7}),b=this.parseResponse(a);return this.logExecution("Content strategy completed",{sections:b.outline.sections.length,totalWords:b.outline.totalEstimatedWords}),b}catch(a){throw this.logExecution("Content strategy failed",{error:a.message}),Error(`Content strategy development failed: ${a}`)}}buildPrompt(a,b,c){let d=b?`
Market Research Context:
- Industry: ${b.industry}
- Key Trends: ${b.trends.join(", ")}
- Opportunities: ${b.opportunities.join(", ")}
- Challenges: ${b.challenges.join(", ")}
- Key Insights: ${b.keyInsights.join(", ")}
`:"",e=c?`
Audience Analysis Context:
- Primary Persona: ${c.primaryPersona.name}
- Pain Points: ${c.primaryPersona.painPoints.join(", ")}
- Goals: ${c.primaryPersona.goals.join(", ")}
- Preferred Channels: ${c.primaryPersona.preferredChannels.join(", ")}
- Content Preferences: ${c.primaryPersona.contentPreferences.join(", ")}
- Messaging Strategy: ${c.recommendations.messagingStrategy.join(", ")}
- Recommended Content Types: ${c.recommendations.contentTypes.join(", ")}
`:"",f=a.keywords?.length?`
Target Keywords: ${a.keywords.join(", ")}
`:"",g=a.platforms?.length?`
Target Platforms: ${a.platforms.join(", ")}
`:"";return`You are a senior content strategist specializing in ${a.contentType} content creation.

Develop a comprehensive content strategy for the following project:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
${a.tone?`- Preferred Tone: ${a.tone}`:""}
${a.brandGuidelines?`- Brand Guidelines: ${a.brandGuidelines}`:""}

${d}
${e}
${f}
${g}

Create a detailed content strategy including:

1. **Content Strategy**:
   - Clear objective and key messages
   - Unique value proposition
   - Key differentiators
   - Compelling call-to-action

2. **Content Outline**:
   - Engaging title and subtitle
   - Detailed section breakdown with headings, subheadings, key points
   - Purpose for each section
   - Estimated word counts

3. **Content Framework**:
   - Attention-grabbing hook
   - Problem statement
   - Solution presentation
   - Benefits highlight
   - Social proof elements
   - Objection handling
   - Urgency creation

4. **SEO Strategy**:
   - Primary, secondary, and long-tail keywords
   - Semantic keywords
   - Optimal keyword density
   - Meta title and description

5. **Distribution Plan**:
   - Primary distribution channels
   - Platform-specific adaptations
   - Publishing schedule recommendations

6. **Measurable Goals**:
   - Primary and secondary objectives
   - Key performance indicators
   - Success benchmarks

Format your response as a detailed JSON object with the following structure:
{
  "strategy": {
    "objective": "clear content objective",
    "keyMessages": ["message 1", "message 2", ...],
    "valueProposition": "unique value proposition",
    "differentiators": ["differentiator 1", "differentiator 2", ...],
    "callToAction": "compelling CTA"
  },
  "outline": {
    "title": "engaging title",
    "subtitle": "supporting subtitle",
    "sections": [
      {
        "heading": "section heading",
        "subheadings": ["subheading 1", "subheading 2", ...],
        "keyPoints": ["point 1", "point 2", ...],
        "purpose": "section purpose",
        "estimatedWordCount": 300
      }
    ],
    "totalEstimatedWords": 1500
  },
  "contentFramework": {
    "hook": "attention-grabbing hook",
    "problemStatement": "problem statement",
    "solutionPresentation": "solution presentation",
    "benefitsHighlight": ["benefit 1", "benefit 2", ...],
    "socialProof": ["proof 1", "proof 2", ...],
    "objectionHandling": ["objection 1", "objection 2", ...],
    "urgencyCreation": "urgency element"
  },
  "seoStrategy": {
    "primaryKeywords": ["keyword 1", "keyword 2", ...],
    "secondaryKeywords": ["secondary 1", "secondary 2", ...],
    "longtailKeywords": ["longtail 1", "longtail 2", ...],
    "semanticKeywords": ["semantic 1", "semantic 2", ...],
    "keywordDensity": 2.5,
    "metaTitle": "SEO-optimized title",
    "metaDescription": "compelling meta description"
  },
  "distributionPlan": {
    "primaryChannels": ["channel 1", "channel 2", ...],
    "contentAdaptations": [
      {
        "platform": "platform name",
        "adaptations": ["adaptation 1", "adaptation 2", ...],
        "specificRequirements": ["requirement 1", "requirement 2", ...]
      }
    ],
    "publishingSchedule": {
      "timing": "optimal timing",
      "frequency": "publishing frequency",
      "optimal_days": ["day 1", "day 2", ...]
    }
  },
  "measurableGoals": {
    "primary": ["primary goal 1", "primary goal 2", ...],
    "secondary": ["secondary goal 1", "secondary goal 2", ...],
    "kpis": ["kpi 1", "kpi 2", ...],
    "benchmarks": ["benchmark 1", "benchmark 2", ...]
  }
}

Provide strategic, actionable content strategy that aligns with market insights and audience needs.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["strategy","outline","contentFramework","seoStrategy","distributionPlan","measurableGoals"]),this.validateRequiredFields(b.strategy,["objective","keyMessages","valueProposition","differentiators","callToAction"]),this.validateRequiredFields(b.outline,["title","sections","totalEstimatedWords"]),Array.isArray(b.outline.sections)||(b.outline.sections=[]),b.outline.totalEstimatedWords||(b.outline.totalEstimatedWords=b.outline.sections.reduce((a,b)=>a+(b.estimatedWordCount||200),0)),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}fallbackParse(a){let b=this.extractTitle(a)||this.generateTitleFromTopic(),c=this.extractSections(a);return{strategy:{objective:this.extractObjective(a)||`Create engaging ${this.getContentType()} content`,keyMessages:this.extractListItems(a,"message")||["Build trust","Provide value","Drive action"],valueProposition:this.extractValueProp(a)||"Delivering exceptional value to our audience",differentiators:this.extractListItems(a,"differentiator")||["Unique approach","Expert insights"],callToAction:this.extractCTA(a)||"Learn more about our solution"},outline:{title:b,subtitle:this.extractSubtitle(a),sections:c,totalEstimatedWords:c.reduce((a,b)=>a+b.estimatedWordCount,0)},contentFramework:{hook:this.extractHook(a)||"Compelling opening that grabs attention",problemStatement:"Understanding the challenge our audience faces",solutionPresentation:"How our approach solves the problem",benefitsHighlight:["Improved efficiency","Better results","Cost savings"],socialProof:["Customer testimonials","Case studies","Industry recognition"],objectionHandling:["Address common concerns","Provide reassurance"],urgencyCreation:"Limited time offer or immediate benefit"},seoStrategy:{primaryKeywords:this.extractKeywords(a,"primary")||["content marketing","strategy"],secondaryKeywords:this.extractKeywords(a,"secondary")||["audience engagement","conversion"],longtailKeywords:["how to improve content strategy","best practices for content creation"],semanticKeywords:["content optimization","digital marketing","audience targeting"],keywordDensity:2,metaTitle:`${b} | Complete Guide`,metaDescription:`Discover effective strategies for ${b.toLowerCase()}. Expert insights and actionable tips.`},distributionPlan:{primaryChannels:["Website","Email","Social Media"],contentAdaptations:[{platform:"Blog",adaptations:["Long-form content","SEO optimization"],specificRequirements:["1500+ words","Internal links","Call-to-action"]}],publishingSchedule:{timing:"Weekday mornings",frequency:"Weekly",optimal_days:["Tuesday","Wednesday","Thursday"]}},measurableGoals:{primary:["Increase engagement","Drive conversions"],secondary:["Build brand awareness","Generate leads"],kpis:["Page views","Time on page","Conversion rate","Social shares"],benchmarks:["10% increase in engagement","5% conversion rate","1000+ page views"]}}}extractTitle(a){for(let b of[/title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/^#\s+(.+)$/m,/^title:\s*(.+)$/m]){let c=a.match(b);if(c)return c[1].trim()}return null}generateTitleFromTopic(){return`The Complete Guide to ${this.getTopic()}`}extractSections(a){let b=[],c=a.split("\n"),d=null;for(let a of c)a.match(/^##\s+/)||a.includes("heading")||a.includes("section")?(d&&b.push(d),d={heading:a.replace(/^##\s+/,"").trim()||"Section Heading",subheadings:[],keyPoints:[],purpose:"Provide valuable information to the reader",estimatedWordCount:300}):d&&(a.startsWith("-")||a.startsWith("*"))&&d.keyPoints.push(a.replace(/^[-*]\s+/,"").trim());return(d&&b.push(d),0===b.length)?[{heading:"Introduction",subheadings:["Overview","Key Benefits"],keyPoints:["Set the context","Introduce main concepts"],purpose:"Engage the reader and set expectations",estimatedWordCount:250},{heading:"Main Content",subheadings:["Core Strategies","Implementation"],keyPoints:["Present main ideas","Provide actionable insights"],purpose:"Deliver the core value of the content",estimatedWordCount:600},{heading:"Conclusion",subheadings:["Key Takeaways","Next Steps"],keyPoints:["Summarize main points","Call to action"],purpose:"Reinforce value and drive action",estimatedWordCount:200}]:b}extractObjective(a){let b=a.match(/objective[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:null}extractValueProp(a){let b=a.match(/value\s*proposition[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:null}extractCTA(a){for(let b of[/call\s*to\s*action[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/cta[\"']?\s*:\s*[\"']([^\"']+)[\"']/i]){let c=a.match(b);if(c)return c[1]}return null}extractSubtitle(a){let b=a.match(/subtitle[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:void 0}extractHook(a){let b=a.match(/hook[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:null}extractKeywords(a,b){let c=RegExp(`${b}\\s*keywords?["']?\\s*:\\s*\\[([^\\]]+)\\]`,"i"),d=a.match(c);return d?d[1].split(",").map(a=>a.trim().replace(/[\"']/g,"")):[]}extractListItems(a,b){let c=a.split("\n"),d=[],e=!1;for(let a of c){if(a.toLowerCase().includes(b)){e=!0;continue}if(e&&(a.startsWith("-")||a.startsWith("*")||a.match(/^\d+\./)))d.push(a.replace(/^[-*\d.\s]+/,"").trim());else if(e&&""===a.trim())break}return d}getTopic(){return"Your Topic"}getContentType(){return"content"}}class j extends f{constructor(){super("AI SEO Optimizer")}async execute(a,b){this.logExecution("Starting AI SEO optimization");let c=b.previousOutputs?.["market-researcher"],d=b.previousOutputs?.["audience-analyzer"],e=b.previousOutputs?.["content-strategist"],f=this.buildPrompt(a,c,d,e);try{let a=await this.callLLM(f,{maxTokens:4e3,temperature:.6}),b=this.parseResponse(a);return this.logExecution("SEO optimization completed",{primaryKeywords:b.keywordStrategy.primaryKeywords.length,metaTitle:b.onPageOptimization.metaTitle.length}),b}catch(a){throw this.logExecution("SEO optimization failed",{error:a.message}),Error(`SEO optimization failed: ${a}`)}}buildPrompt(a,b,c,d){let e=b?`
Market Research Context:
- Industry: ${b.industry}
- Key Trends: ${b.trends.join(", ")}
- Competitors: ${b.competitors.join(", ")}
`:"",f=c?`
Audience Context:
- Primary Persona: ${c.primaryPersona.name}
- Pain Points: ${c.primaryPersona.painPoints.join(", ")}
- Preferred Channels: ${c.primaryPersona.preferredChannels.join(", ")}
`:"",g=d?`
Content Strategy Context:
- Title: ${d.outline.title}
- Primary Keywords: ${d.seoStrategy.primaryKeywords.join(", ")}
- Meta Title: ${d.seoStrategy.metaTitle}
- Meta Description: ${d.seoStrategy.metaDescription}
- Content Sections: ${d.outline.sections.map(a=>a.heading).join(", ")}
`:"",h=a.keywords?.length?`
Provided Keywords: ${a.keywords.join(", ")}
`:"";return`You are an advanced AI SEO specialist with expertise in both traditional and AI-powered search optimization.

Optimize the following content for maximum search visibility:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
${a.tone?`- Tone: ${a.tone}`:""}

${e}
${f}
${g}
${h}

Provide comprehensive SEO optimization including:

1. **Keyword Strategy**:
   - Primary keywords with search volume, difficulty, and intent analysis
   - Secondary and long-tail keywords
   - Semantic and LSI keywords
   - Keyword clustering for topical authority

2. **On-Page Optimization**:
   - Optimized meta title and description
   - Header tag structure (H1, H2, H3)
   - URL slug optimization
   - Keyword density recommendations
   - Internal linking suggestions
   - Schema markup recommendations

3. **Content Optimization**:
   - Title variations for A/B testing
   - Heading optimizations
   - Content gap analysis
   - Competitor analysis insights
   - Readability improvements

4. **AI Search Optimization**:
   - Answer engine optimization (Google, ChatGPT, Perplexity)
   - Featured snippet targeting
   - FAQ suggestions for AI queries
   - Voice search optimization
   - Entity and topical authority building

5. **Technical SEO**:
   - Crawlability recommendations
   - Page speed optimization
   - Core Web Vitals improvements
   - Mobile optimization

6. **Link Building Strategy**:
   - Target domains for outreach
   - Content assets for link attraction
   - Link-worthy angles

7. **Performance Tracking**:
   - Key metrics to monitor
   - Tracking setup recommendations
   - Success benchmarks

Format your response as a detailed JSON object with the following structure:
{
  "keywordStrategy": {
    "primaryKeywords": [
      {
        "keyword": "keyword phrase",
        "searchVolume": "volume estimate",
        "difficulty": "low/medium/high",
        "intent": "informational/commercial/transactional/navigational",
        "priority": "high/medium/low"
      }
    ],
    "secondaryKeywords": ["keyword 1", "keyword 2", ...],
    "longtailKeywords": ["longtail 1", "longtail 2", ...],
    "semanticKeywords": ["semantic 1", "semantic 2", ...],
    "lsiKeywords": ["lsi 1", "lsi 2", ...],
    "keywordClusters": [
      {
        "cluster": "cluster name",
        "keywords": ["keyword 1", "keyword 2", ...],
        "searchIntent": "intent description"
      }
    ]
  },
  "onPageOptimization": {
    "metaTitle": "optimized meta title",
    "metaDescription": "optimized meta description",
    "h1Tag": "optimized H1",
    "h2Tags": ["H2 tag 1", "H2 tag 2", ...],
    "h3Tags": ["H3 tag 1", "H3 tag 2", ...],
    "urlSlug": "optimized-url-slug",
    "focusKeyphrase": "primary focus keyword",
    "keywordDensity": {
      "target": 2.5,
      "primary": 2.0,
      "secondary": 1.5
    },
    "internalLinkingSuggestions": ["suggestion 1", "suggestion 2", ...],
    "imageAltTags": ["alt tag 1", "alt tag 2", ...],
    "schemaMarkup": {
      "type": "Article",
      "properties": {
        "headline": "article headline",
        "author": "author name",
        "datePublished": "publication date"
      }
    }
  },
  "contentOptimization": {
    "titleVariations": ["title 1", "title 2", ...],
    "headingOptimizations": [
      {
        "original": "original heading",
        "optimized": "optimized heading",
        "reasoning": "optimization reasoning"
      }
    ],
    "contentGaps": ["gap 1", "gap 2", ...],
    "competitorAnalysis": {
      "topCompetitors": ["competitor 1", "competitor 2", ...],
      "contentGaps": ["gap 1", "gap 2", ...],
      "opportunities": ["opportunity 1", "opportunity 2", ...]
    },
    "readabilityScore": 75,
    "readabilityRecommendations": ["recommendation 1", "recommendation 2", ...]
  },
  "aiSearchOptimization": {
    "answerEngineOptimization": {
      "featuredSnippetTargets": ["question 1", "question 2", ...],
      "faqSuggestions": [
        {
          "question": "FAQ question",
          "answer": "concise answer"
        }
      ],
      "conversationalQueries": ["query 1", "query 2", ...]
    },
    "voiceSearchOptimization": {
      "naturalLanguageQueries": ["query 1", "query 2", ...],
      "questionBasedContent": ["question 1", "question 2", ...],
      "localOptimization": ["local tip 1", "local tip 2", ...]
    },
    "entityOptimization": {
      "primaryEntities": ["entity 1", "entity 2", ...],
      "entityRelationships": ["relationship 1", "relationship 2", ...],
      "topicalAuthority": ["authority area 1", "authority area 2", ...]
    }
  },
  "technicalSEO": {
    "crawlability": ["recommendation 1", "recommendation 2", ...],
    "pagespeedRecommendations": ["speed tip 1", "speed tip 2", ...],
    "mobileOptimization": ["mobile tip 1", "mobile tip 2", ...],
    "coreWebVitals": {
      "lcpRecommendations": ["lcp tip 1", "lcp tip 2", ...],
      "fidRecommendations": ["fid tip 1", "fid tip 2", ...],
      "clsRecommendations": ["cls tip 1", "cls tip 2", ...]
    }
  },
  "linkBuildingStrategy": {
    "targetDomains": ["domain 1", "domain 2", ...],
    "outreachTemplates": ["template 1", "template 2", ...],
    "contentAssets": ["asset 1", "asset 2", ...],
    "linkWorthyAngles": ["angle 1", "angle 2", ...]
  },
  "performanceTracking": {
    "kpis": ["kpi 1", "kpi 2", ...],
    "trackingSetup": ["setup 1", "setup 2", ...],
    "reportingSchedule": "monthly",
    "successMetrics": [
      {
        "metric": "organic traffic",
        "target": "25% increase",
        "timeframe": "3 months"
      }
    ]
  }
}

Provide cutting-edge SEO optimization that works for both traditional and AI-powered search engines.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["keywordStrategy","onPageOptimization","contentOptimization","aiSearchOptimization","technicalSEO","linkBuildingStrategy","performanceTracking"]),Array.isArray(b.keywordStrategy.primaryKeywords)||(b.keywordStrategy.primaryKeywords=[]),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}fallbackParse(a){let b=this.extractMetaTitle(a)||"Optimized Content Title",c=this.extractKeywordsList(a,"keyword")||["content marketing","strategy"];return{keywordStrategy:{primaryKeywords:c.slice(0,3).map(a=>({keyword:a,searchVolume:"Medium",difficulty:"Medium",intent:"informational",priority:"high"})),secondaryKeywords:c.slice(3,8),longtailKeywords:[`how to ${c[0]}`,`best ${c[0]} strategies`,`${c[0]} guide for beginners`],semanticKeywords:["optimization","strategy","best practices","guide"],lsiKeywords:["digital marketing","content creation","audience engagement"],keywordClusters:[{cluster:"Primary Topic",keywords:c.slice(0,3),searchIntent:"Users seeking comprehensive information about the topic"}]},onPageOptimization:{metaTitle:b,metaDescription:`Discover the ultimate guide to ${c[0]}. Expert insights, proven strategies, and actionable tips for success.`,h1Tag:b,h2Tags:["Introduction to the Topic","Key Strategies and Techniques","Implementation Best Practices","Common Challenges and Solutions","Conclusion and Next Steps"],h3Tags:["Getting Started","Advanced Techniques","Tools and Resources","Measuring Success"],urlSlug:this.generateSlug(b),focusKeyphrase:c[0],keywordDensity:{target:2.5,primary:2,secondary:1.5},internalLinkingSuggestions:["Link to related blog posts","Link to product/service pages","Link to resource pages","Link to case studies"],imageAltTags:[`${c[0]} infographic`,`${c[0]} diagram`,`${c[0]} example screenshot`],schemaMarkup:{type:"Article",properties:{headline:b,author:"Content Team",datePublished:new Date().toISOString()}}},contentOptimization:{titleVariations:[b,`The Complete Guide to ${c[0]}`,`Master ${c[0]}: A Step-by-Step Guide`,`${c[0]} Strategies That Actually Work`],headingOptimizations:[{original:"Introduction",optimized:`Why ${c[0]} Matters in 2025`,reasoning:"Includes target keyword and adds temporal relevance"}],contentGaps:["Industry-specific examples","Step-by-step tutorials","Common mistake prevention","Tool recommendations"],competitorAnalysis:{topCompetitors:["Industry leader 1","Industry leader 2","Emerging competitor"],contentGaps:["Advanced techniques","Recent updates","Case studies"],opportunities:["Unique angle","Better examples","More comprehensive coverage"]},readabilityScore:75,readabilityRecommendations:["Use shorter sentences","Add more subheadings","Include bullet points","Simplify complex terms"]},aiSearchOptimization:{answerEngineOptimization:{featuredSnippetTargets:[`What is ${c[0]}?`,`How to implement ${c[0]}?`,`Best practices for ${c[0]}`],faqSuggestions:[{question:`What is ${c[0]}?`,answer:`${c[0]} is a strategic approach to creating and distributing valuable content to attract and engage your target audience.`},{question:`How long does ${c[0]} take to show results?`,answer:`Most businesses see initial results from ${c[0]} within 3-6 months, with significant improvements after 6-12 months of consistent effort.`}],conversationalQueries:[`Tell me about ${c[0]}`,`How can I get better at ${c[0]}?`,`What are the benefits of ${c[0]}?`]},voiceSearchOptimization:{naturalLanguageQueries:[`How do I start with ${c[0]}?`,`What are the best tools for ${c[0]}?`,`Why is ${c[0]} important for my business?`],questionBasedContent:[`What is ${c[0]}?`,`How does ${c[0]} work?`,`When should I use ${c[0]}?`],localOptimization:["Include location-specific examples","Mention local business applications","Use region-specific case studies"]},entityOptimization:{primaryEntities:[c[0],"digital marketing","business strategy"],entityRelationships:[`${c[0]} → business growth`,`${c[0]} → customer engagement`,`${c[0]} → ROI improvement`],topicalAuthority:["Industry expertise","Thought leadership","Best practices","Innovation trends"]}},technicalSEO:{crawlability:["Ensure clean URL structure","Optimize internal linking","Create XML sitemap","Use proper robots.txt"],pagespeedRecommendations:["Optimize images","Minimize CSS/JS","Enable compression","Use CDN"],mobileOptimization:["Responsive design","Fast mobile loading","Touch-friendly navigation","Mobile-first indexing ready"],coreWebVitals:{lcpRecommendations:["Optimize largest contentful paint","Preload key resources"],fidRecommendations:["Minimize JavaScript execution","Use efficient event handlers"],clsRecommendations:["Reserve space for images","Avoid layout shifts"]}},linkBuildingStrategy:{targetDomains:["Industry publications","Relevant blogs","Resource pages","Partner websites"],outreachTemplates:["Guest post proposal","Resource page inclusion","Broken link replacement","Expert quote request"],contentAssets:["Comprehensive guides","Industry research","Infographics","Tool resources"],linkWorthyAngles:["Original research data","Unique industry insights","Comprehensive resource compilation","Expert interviews"]},performanceTracking:{kpis:["Organic traffic growth","Keyword rankings","Click-through rates","Conversion rates","Backlink acquisition"],trackingSetup:["Google Analytics 4","Google Search Console","Keyword tracking tools","Backlink monitoring","Core Web Vitals tracking"],reportingSchedule:"Monthly with weekly check-ins",successMetrics:[{metric:"Organic traffic",target:"25% increase",timeframe:"3 months"},{metric:"Target keyword rankings",target:"Top 10 positions",timeframe:"6 months"},{metric:"Featured snippets",target:"3 featured snippets",timeframe:"6 months"}]}}}extractMetaTitle(a){for(let b of[/meta\s*title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i]){let c=a.match(b);if(c)return c[1]}return null}extractKeywordsList(a,b){let c=RegExp(`${b}s?["']?\\s*:\\s*\\[([^\\]]+)\\]`,"i"),d=a.match(c);if(d)return d[1].split(",").map(a=>a.trim().replace(/[\"']/g,""));let e=a.split("\n"),f=[],g=!1;for(let a of e){if(a.toLowerCase().includes(b)){g=!0;continue}if(g&&(a.startsWith("-")||a.startsWith("*")||a.match(/^\d+\./)))f.push(a.replace(/^[-*\d.\s]+/,"").trim());else if(g&&""===a.trim())break}return f}generateSlug(a){return a.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").trim()}}class k extends f{constructor(){super("Content Writer")}async execute(a,b){this.logExecution("Starting content writing");let c=b.previousOutputs?.["market-researcher"],d=b.previousOutputs?.["audience-analyzer"],e=b.previousOutputs?.["content-strategist"],f=b.previousOutputs?.["ai-seo-optimizer"],g=this.buildPrompt(a,c,d,e,f);try{let a=await this.callLLM(g,{maxTokens:4e3,temperature:.8}),b=this.parseResponse(a);return this.logExecution("Content writing completed",{wordCount:b.metadata.wordCount,sections:b.content.mainContent.length}),b}catch(a){throw this.logExecution("Content writing failed",{error:a.message}),Error(`Content writing failed: ${a}`)}}buildPrompt(a,b,c,d,e){let f=b?`
Market Research Context:
- Industry: ${b.industry}
- Key Trends: ${b.trends.join(", ")}
- Opportunities: ${b.opportunities.join(", ")}
- Key Insights: ${b.keyInsights.join(", ")}
`:"",g=c?`
Audience Context:
- Primary Persona: ${c.primaryPersona.name}
- Pain Points: ${c.primaryPersona.painPoints.join(", ")}
- Goals: ${c.primaryPersona.goals.join(", ")}
- Values: ${c.primaryPersona.psychographics.values.join(", ")}
- Content Preferences: ${c.primaryPersona.contentPreferences.join(", ")}
`:"",h=d?`
Content Strategy Context:
- Title: ${d.outline.title}
- Key Messages: ${d.strategy.keyMessages.join(", ")}
- Value Proposition: ${d.strategy.valueProposition}
- Call to Action: ${d.strategy.callToAction}
- Content Framework Hook: ${d.contentFramework.hook}
- Problem Statement: ${d.contentFramework.problemStatement}
- Solution Presentation: ${d.contentFramework.solutionPresentation}
- Benefits: ${d.contentFramework.benefitsHighlight.join(", ")}

Content Sections:
${d.outline.sections.map(a=>`
- ${a.heading} (${a.estimatedWordCount} words)
  Purpose: ${a.purpose}
  Key Points: ${a.keyPoints.join(", ")}
`).join("")}
`:"",i=e?`
SEO Guidelines:
- Primary Keywords: ${e.keywordStrategy.primaryKeywords.map(a=>a.keyword).join(", ")}
- Secondary Keywords: ${e.keywordStrategy.secondaryKeywords.join(", ")}
- Focus Keyphrase: ${e.onPageOptimization.focusKeyphrase}
- Target Keyword Density: ${e.onPageOptimization.keywordDensity.target}%
- H1 Tag: ${e.onPageOptimization.h1Tag}
- H2 Tags: ${e.onPageOptimization.h2Tags.join(", ")}
- Meta Title: ${e.onPageOptimization.metaTitle}
- Meta Description: ${e.onPageOptimization.metaDescription}
`:"";return`You are a professional content writer specializing in ${a.contentType} content that converts.

Write compelling, engaging content for the following project:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
- Tone: ${a.tone||"Professional and engaging"}
${a.brandGuidelines?`- Brand Guidelines: ${a.brandGuidelines}`:""}

${f}
${g}
${h}
${i}

Write high-quality content that includes:

1. **Main Content Structure**:
   - Compelling title and subtitle
   - Engaging introduction with hook
   - Well-structured main content sections
   - Strong conclusion with clear next steps
   - Powerful call-to-action

2. **Content Quality**:
   - Natural keyword integration
   - Engaging storytelling elements
   - Clear value propositions
   - Social proof integration
   - Actionable insights

3. **SEO Integration**:
   - Proper heading hierarchy
   - Natural keyword placement
   - Internal linking opportunities
   - Image recommendations with alt text

4. **Engagement Elements**:
   - Attention-grabbing hooks
   - Smooth transitions
   - Emotional triggers
   - Urgency creators

5. **Brand Alignment**:
   - Consistent brand voice
   - Message alignment
   - Appropriate tone
   - Brand keyword integration

Format your response as a detailed JSON object with the following structure:
{
  "content": {
    "title": "compelling title",
    "subtitle": "supporting subtitle",
    "introduction": "engaging introduction paragraph",
    "mainContent": [
      {
        "heading": "section heading",
        "subheading": "optional subheading",
        "paragraphs": ["paragraph 1", "paragraph 2", ...],
        "bulletPoints": ["point 1", "point 2", ...],
        "callouts": [
          {
            "type": "tip",
            "content": "helpful tip content"
          }
        ]
      }
    ],
    "conclusion": "strong conclusion paragraph",
    "callToAction": "compelling call to action"
  },
  "metadata": {
    "wordCount": 1500,
    "readingTime": 6,
    "keywordDensity": {
      "primary": 2.5,
      "secondary": 1.8
    },
    "tone": "professional",
    "readabilityScore": 75
  },
  "seoElements": {
    "metaTitle": "SEO-optimized title",
    "metaDescription": "compelling meta description",
    "focusKeyword": "primary keyword",
    "headingStructure": [
      {
        "level": 1,
        "text": "H1 heading",
        "keywords": ["keyword 1", "keyword 2"]
      }
    ],
    "internalLinks": [
      {
        "anchor": "link text",
        "url": "/related-page",
        "context": "where to place link"
      }
    ],
    "imageRecommendations": [
      {
        "description": "image description",
        "altText": "SEO-friendly alt text",
        "placement": "after introduction"
      }
    ]
  },
  "engagementElements": {
    "hooks": ["hook 1", "hook 2", ...],
    "transitionPhrases": ["transition 1", "transition 2", ...],
    "socialProofElements": ["proof 1", "proof 2", ...],
    "urgencyCreators": ["urgency 1", "urgency 2", ...],
    "emotionalTriggers": ["trigger 1", "trigger 2", ...]
  },
  "brandAlignment": {
    "voiceConsistency": 95,
    "messageAlignment": 90,
    "tonalAccuracy": 88,
    "brandKeywords": ["brand keyword 1", "brand keyword 2", ...]
  },
  "qualityMetrics": {
    "originalityScore": 96,
    "relevanceScore": 94,
    "engagementScore": 89,
    "conversionPotential": 87
  }
}

Write content that is original, engaging, and optimized for both human readers and search engines.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["content","metadata","seoElements","engagementElements","brandAlignment","qualityMetrics"]),this.validateRequiredFields(b.content,["title","introduction","mainContent","conclusion","callToAction"]),Array.isArray(b.content.mainContent)||(b.content.mainContent=[]),b.metadata.wordCount||(b.metadata.wordCount=this.calculateWordCount(b.content)),b.metadata.readingTime||(b.metadata.readingTime=Math.ceil(b.metadata.wordCount/250)),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}fallbackParse(a){let b=this.extractTitle(a)||"Engaging Content Title",c=this.extractContentSections(a),d=this.estimateWordCount(a);return{content:{title:b,subtitle:this.extractSubtitle(a),introduction:this.extractIntroduction(a)||"Compelling introduction that hooks the reader and sets the stage for valuable insights ahead.",mainContent:c,conclusion:this.extractConclusion(a)||"In conclusion, these strategies will help you achieve your goals and create meaningful impact.",callToAction:this.extractCallToAction(a)||"Ready to get started? Take action today and see the results for yourself."},metadata:{wordCount:d,readingTime:Math.ceil(d/250),keywordDensity:{primary:2,secondary:1.5},tone:"professional",readabilityScore:75},seoElements:{metaTitle:b,metaDescription:`Discover ${b.toLowerCase()}. Expert insights and actionable strategies for success.`,focusKeyword:this.extractMainKeyword(a)||"content strategy",headingStructure:[{level:1,text:b,keywords:[this.extractMainKeyword(a)||"content"]},...c.map((a,b)=>({level:2,text:a.heading,keywords:[`keyword ${b+1}`]}))],internalLinks:[{anchor:"related resources",url:"/resources",context:"in the main content"}],imageRecommendations:[{description:"Hero image representing the main topic",altText:`${b} illustration`,placement:"after introduction"}]},engagementElements:{hooks:["Attention-grabbing opening question","Surprising statistic or fact","Relatable scenario"],transitionPhrases:["Now that we understand...","Building on this concept...","Here's the key insight..."],socialProofElements:["Industry expert testimonials","Case study results","User success stories"],urgencyCreators:["Limited-time insights","First-mover advantage","Immediate implementation benefits"],emotionalTriggers:["Aspiration for success","Fear of missing out","Desire for improvement"]},brandAlignment:{voiceConsistency:90,messageAlignment:85,tonalAccuracy:88,brandKeywords:["expertise","innovation","results","quality"]},qualityMetrics:{originalityScore:92,relevanceScore:89,engagementScore:86,conversionPotential:83}}}extractTitle(a){for(let b of[/title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/^#\s+(.+)$/m,/^title:\s*(.+)$/m]){let c=a.match(b);if(c)return c[1].trim()}return null}extractSubtitle(a){let b=a.match(/subtitle[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:void 0}extractIntroduction(a){let b=a.match(/introduction[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:null}extractConclusion(a){let b=a.match(/conclusion[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);return b?b[1]:null}extractCallToAction(a){for(let b of[/call\s*to\s*action[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/cta[\"']?\s*:\s*[\"']([^\"']+)[\"']/i]){let c=a.match(b);if(c)return c[1]}return null}extractMainKeyword(a){for(let b of[/focus\s*keyword[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/primary\s*keyword[\"']?\s*:\s*[\"']([^\"']+)[\"']/i]){let c=a.match(b);if(c)return c[1]}return null}extractContentSections(a){let b=[],c=a.split("\n"),d=null;for(let a of c)a.match(/^##\s+/)||a.includes("heading")?(d&&b.push(d),d={heading:a.replace(/^##\s+/,"").trim()||"Section Heading",paragraphs:[],bulletPoints:[]}):d&&a.trim()&&!a.startsWith("#")&&(a.startsWith("-")||a.startsWith("*")?d.bulletPoints.push(a.replace(/^[-*]\s+/,"").trim()):a.length>50&&d.paragraphs.push(a.trim()));return(d&&b.push(d),0===b.length)?[{heading:"Understanding the Fundamentals",paragraphs:["This section establishes the foundation and core concepts that readers need to understand.","We explore the key principles and provide context for the strategies that follow."],bulletPoints:["Core concept definition","Historical context","Current relevance"]},{heading:"Proven Strategies and Techniques",paragraphs:["Here we dive deep into actionable strategies that have been proven to work.","Each technique is backed by real-world examples and measurable results."],bulletPoints:["Strategy implementation steps","Best practices and tips","Common pitfalls to avoid"]},{heading:"Implementation and Next Steps",paragraphs:["The final section focuses on practical implementation and long-term success.","We provide a clear roadmap for putting these insights into action."],bulletPoints:["Step-by-step implementation guide","Timeline recommendations","Success measurement metrics"]}]:b}calculateWordCount(a){let b=0;return a.title&&(b+=a.title.split(" ").length),a.subtitle&&(b+=a.subtitle.split(" ").length),a.introduction&&(b+=a.introduction.split(" ").length),a.conclusion&&(b+=a.conclusion.split(" ").length),a.callToAction&&(b+=a.callToAction.split(" ").length),a.mainContent&&a.mainContent.forEach(a=>{a.heading&&(b+=a.heading.split(" ").length),a.subheading&&(b+=a.subheading.split(" ").length),a.paragraphs&&a.paragraphs.forEach(a=>{b+=a.split(" ").length}),a.bulletPoints&&a.bulletPoints.forEach(a=>{b+=a.split(" ").length})}),b}estimateWordCount(a){return a.split(/\s+/).length}}class l extends f{constructor(){super("Content Editor")}async execute(a,b){this.logExecution("Starting content editing and review");let c=b.previousOutputs?.["content-writer"],d=b.previousOutputs?.["ai-seo-optimizer"],e=b.previousOutputs?.["content-strategist"];if(!c)throw Error("Content Writer output is required for editing");let f=this.buildPrompt(a,c,d,e);try{let a=await this.callLLM(f,{maxTokens:4e3,temperature:.5}),b=this.parseResponse(a,c);return this.logExecution("Content editing completed",{changesCount:b.editingReport.changesCount,qualityScore:b.editingReport.qualityScore}),b}catch(a){throw this.logExecution("Content editing failed",{error:a.message}),Error(`Content editing failed: ${a}`)}}buildPrompt(a,b,c,d){let e=JSON.stringify(b.content,null,2),f=c?`
SEO Guidelines for Review:
- Primary Keywords: ${c.keywordStrategy.primaryKeywords.map(a=>a.keyword).join(", ")}
- Target Keyword Density: ${c.onPageOptimization.keywordDensity.target}%
- Focus Keyphrase: ${c.onPageOptimization.focusKeyphrase}
- Readability Target: ${c.contentOptimization.readabilityScore}+
`:"",g=d?`
Brand Guidelines:
- Key Messages: ${d.strategy.keyMessages.join(", ")}
- Value Proposition: ${d.strategy.valueProposition}
- Brand Voice Requirements: Professional, engaging, trustworthy
`:"";return`You are a senior content editor specializing in ${a.contentType} content optimization.

Review and edit the following content for maximum quality, engagement, and effectiveness:

**Project Requirements:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
- Tone: ${a.tone||"Professional and engaging"}
${a.brandGuidelines?`- Brand Guidelines: ${a.brandGuidelines}`:""}

${f}
${g}

**Original Content to Edit:**
${e}

**Content Metadata:**
- Word Count: ${b.metadata.wordCount}
- Reading Time: ${b.metadata.readingTime} minutes
- Current Readability Score: ${b.metadata.readabilityScore}

Perform comprehensive content editing including:

1. **Grammar and Style Review**:
   - Fix grammatical errors
   - Improve sentence structure
   - Enhance clarity and flow
   - Ensure consistent style

2. **Content Quality Enhancement**:
   - Strengthen weak sections
   - Improve transitions
   - Enhance engagement elements
   - Optimize value delivery

3. **SEO Optimization Review**:
   - Verify keyword placement and density
   - Optimize heading structure
   - Improve meta elements
   - Ensure natural keyword integration

4. **Brand Alignment Check**:
   - Verify voice consistency
   - Ensure message alignment
   - Check tonal accuracy
   - Validate brand guideline compliance

5. **Readability Improvement**:
   - Simplify complex sentences
   - Improve paragraph structure
   - Enhance scanability
   - Optimize for accessibility

6. **Engagement Optimization**:
   - Strengthen hooks and CTAs
   - Improve emotional resonance
   - Enhance social proof integration
   - Optimize conversion elements

Provide detailed editing results in JSON format:
{
  "editedContent": {
    "title": "improved title",
    "subtitle": "enhanced subtitle",
    "introduction": "polished introduction",
    "mainContent": [
      {
        "heading": "improved heading",
        "subheading": "enhanced subheading",
        "paragraphs": ["edited paragraph 1", "edited paragraph 2", ...],
        "bulletPoints": ["improved point 1", "improved point 2", ...],
        "callouts": [
          {
            "type": "tip",
            "content": "enhanced callout content"
          }
        ]
      }
    ],
    "conclusion": "strengthened conclusion",
    "callToAction": "optimized call to action"
  },
  "editingReport": {
    "changesCount": 15,
    "improvementAreas": ["clarity", "engagement", "seo", "flow"],
    "qualityScore": 92,
    "readabilityScore": 78,
    "seoScore": 88,
    "engagementScore": 85
  },
  "revisions": [
    {
      "section": "introduction",
      "originalText": "original text",
      "revisedText": "improved text",
      "reason": "improved clarity and engagement",
      "category": "clarity"
    }
  ],
  "qualityAssurance": {
    "grammarCheck": {
      "score": 95,
      "issues": [
        {
          "issue": "comma splice in paragraph 2",
          "suggestion": "use semicolon or split sentence",
          "location": "main content section 1"
        }
      ]
    },
    "clarityCheck": {
      "score": 88,
      "improvements": ["simplified technical terms", "improved transitions"]
    },
    "consistencyCheck": {
      "score": 92,
      "voiceConsistency": 94,
      "terminologyConsistency": 90,
      "toneConsistency": 92
    },
    "factCheck": {
      "score": 85,
      "verificationNeeded": ["statistic in paragraph 3"],
      "sources": ["industry report", "case study"]
    }
  },
  "seoEnhancements": {
    "keywordOptimization": {
      "primaryKeywordDensity": 2.3,
      "secondaryKeywordDensity": 1.8,
      "keywordDistribution": "well distributed",
      "naturalness": 90
    },
    "headingOptimization": {
      "h1Optimized": true,
      "h2Structure": "hierarchical and keyword-rich",
      "keywordInHeadings": 85
    },
    "metaOptimization": {
      "titleLength": 58,
      "descriptionLength": 155,
      "titleKeywordPlacement": "front-loaded"
    }
  },
  "engagementEnhancements": {
    "hookStrength": 88,
    "transitionQuality": 85,
    "callToActionEffectiveness": 90,
    "emotionalResonance": 82,
    "valueDelivery": 89
  },
  "brandCompliance": {
    "voiceAlignment": 92,
    "messageConsistency": 88,
    "tonalAccuracy": 90,
    "guidelineCompliance": 87,
    "brandKeywordUsage": 85
  },
  "finalRecommendations": {
    "immediateChanges": ["fix remaining grammar issues", "strengthen weak transitions"],
    "futureImprovements": ["add more case studies", "include expert quotes"],
    "a11yRecommendations": ["add alt text for images", "improve heading structure"],
    "performanceOptimizations": ["optimize content length", "improve readability score"]
  }
}

Focus on creating polished, professional content that achieves maximum impact and effectiveness.`}parseResponse(a,b){try{let c=this.extractJSONFromResponse(a);return this.validateRequiredFields(c,["editedContent","editingReport","revisions","qualityAssurance","seoEnhancements","engagementEnhancements","brandCompliance","finalRecommendations"]),Array.isArray(c.revisions)||(c.revisions=[]),c.editedContent&&c.editedContent.title||(c.editedContent=this.createMinimalEdit(b.content)),this.sanitizeOutput(c)}catch(a){return this.logExecution("JSON parsing failed, using fallback edit"),this.fallbackEdit(b)}}createMinimalEdit(a){return{...a,title:this.improveTitle(a.title),introduction:this.improveText(a.introduction),conclusion:this.improveText(a.conclusion),callToAction:this.improveCallToAction(a.callToAction)}}fallbackEdit(a){let b=this.createMinimalEdit(a.content);return{editedContent:b,editingReport:{changesCount:8,improvementAreas:["clarity","engagement","flow"],qualityScore:88,readabilityScore:76,seoScore:85,engagementScore:82},revisions:[{section:"title",originalText:a.content.title,revisedText:b.title,reason:"Enhanced clarity and engagement",category:"engagement"},{section:"introduction",originalText:a.content.introduction,revisedText:b.introduction,reason:"Improved flow and readability",category:"clarity"}],qualityAssurance:{grammarCheck:{score:92,issues:[{issue:"Minor punctuation improvements needed",suggestion:"Review comma usage in complex sentences",location:"throughout content"}]},clarityCheck:{score:85,improvements:["Simplified complex sentences","Improved paragraph transitions"]},consistencyCheck:{score:90,voiceConsistency:88,terminologyConsistency:92,toneConsistency:90},factCheck:{score:88,verificationNeeded:["Industry statistics","Best practice claims"],sources:["Industry reports","Case studies","Expert interviews"]}},seoEnhancements:{keywordOptimization:{primaryKeywordDensity:2.2,secondaryKeywordDensity:1.6,keywordDistribution:"well distributed throughout content",naturalness:88},headingOptimization:{h1Optimized:!0,h2Structure:"hierarchical and keyword-optimized",keywordInHeadings:82},metaOptimization:{titleLength:58,descriptionLength:158,titleKeywordPlacement:"front-loaded for maximum impact"}},engagementEnhancements:{hookStrength:85,transitionQuality:82,callToActionEffectiveness:88,emotionalResonance:80,valueDelivery:87},brandCompliance:{voiceAlignment:89,messageConsistency:86,tonalAccuracy:88,guidelineCompliance:85,brandKeywordUsage:82},finalRecommendations:{immediateChanges:["Review and refine transition sentences","Strengthen call-to-action language","Optimize keyword placement for naturalness"],futureImprovements:["Add more specific examples and case studies","Include expert quotes and testimonials","Develop supporting visual content recommendations"],a11yRecommendations:["Ensure proper heading hierarchy","Add descriptive link text","Include alt text recommendations for images"],performanceOptimizations:["Optimize content length for target audience","Improve scannability with more subheadings","Enhance mobile readability"]}}}improveTitle(a){let b=/\d/.test(a),c=["Ultimate","Complete","Essential","Proven","Expert"].some(b=>a.includes(b));return b||c?a:`The Complete Guide to ${a}`}improveText(a){return a.replace(/\s+/g," ").replace(/([.!?])\s*([A-Z])/g,"$1 $2").trim()}improveCallToAction(a){return["Discover","Start","Get","Learn","Transform","Achieve"].some(b=>a.includes(b))?a:`Get started with ${a.toLowerCase()}`}}class m extends f{constructor(){super("Social Media Specialist")}async execute(a,b){this.logExecution("Starting social media content adaptation");let c=b.previousOutputs?.["content-editor"],d=b.previousOutputs?.["audience-analyzer"],e=b.previousOutputs?.["content-strategist"];if(!c)throw Error("Content Editor output is required for social media adaptation");let f=this.determineTargetPlatforms(a,d),g=this.buildPrompt(a,c,d,e,f);try{let a=await this.callLLM(g,{maxTokens:4e3,temperature:.7}),b=this.parseResponse(a);return this.logExecution("Social media adaptation completed",{platforms:b.platforms.length,totalPosts:b.platforms.reduce((a,b)=>a+b.content.posts.length,0)}),b}catch(a){throw this.logExecution("Social media adaptation failed",{error:a.message}),Error(`Social media adaptation failed: ${a}`)}}determineTargetPlatforms(a,b){if(a.platforms&&a.platforms.length>0)return a.platforms;if(b)return b.primaryPersona.preferredChannels.filter(a=>["twitter","linkedin","facebook","instagram","tiktok","youtube","pinterest"].includes(a.toLowerCase()));switch(a.contentType){case"blog":default:return["linkedin","twitter","facebook"];case"social":return["instagram","twitter","linkedin","facebook"];case"landing":return["facebook","linkedin","twitter"]}}buildPrompt(a,b,c,d,e=[]){let f=JSON.stringify(b.editedContent,null,2),g=c?`
Audience Context:
- Primary Persona: ${c.primaryPersona.name}
- Interests: ${c.primaryPersona.psychographics.interests.join(", ")}
- Preferred Channels: ${c.primaryPersona.preferredChannels.join(", ")}
- Content Preferences: ${c.primaryPersona.contentPreferences.join(", ")}
- Goals: ${c.primaryPersona.goals.join(", ")}
- Pain Points: ${c.primaryPersona.painPoints.join(", ")}
`:"",h=d?`
Content Strategy Context:
- Key Messages: ${d.strategy.keyMessages.join(", ")}
- Value Proposition: ${d.strategy.valueProposition}
- Call to Action: ${d.strategy.callToAction}
- Distribution Channels: ${d.distributionPlan.primaryChannels.join(", ")}
`:"";return`You are a social media specialist with expertise in multi-platform content adaptation and viral marketing strategies.

Adapt the following content for social media platforms with maximum engagement and conversion potential:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
- Target Platforms: ${e.join(", ")||"LinkedIn, Twitter, Facebook"}
${a.tone?`- Brand Tone: ${a.tone}`:""}

${g}
${h}

**Source Content to Adapt:**
${f}

Create comprehensive social media content strategy including:

1. **Platform-Specific Content**:
   - Tailored posts for each platform
   - Optimal formats and lengths
   - Platform-native features utilization
   - Algorithm optimization strategies

2. **Engagement Optimization**:
   - Compelling hooks and captions
   - Strategic hashtag usage
   - Call-to-action optimization
   - Community engagement tactics

3. **Content Repurposing**:
   - Multi-format adaptations
   - Cross-platform synergies
   - Content multiplication strategies
   - Timing and sequencing

4. **Community Building**:
   - User-generated content strategies
   - Influencer collaboration opportunities
   - Community management guidelines
   - Crisis response protocols

5. **Paid Promotion Strategy**:
   - Ad copy variations
   - Targeting recommendations
   - Budget allocation
   - Campaign optimization

6. **Performance Tracking**:
   - Platform-specific metrics
   - Success benchmarks
   - Analytics setup
   - ROI measurement

Format your response as a detailed JSON object:
{
  "platforms": [
    {
      "platform": "linkedin",
      "content": {
        "posts": [
          {
            "type": "text",
            "content": "engaging post content",
            "caption": "compelling caption",
            "hashtags": ["#hashtag1", "#hashtag2", ...],
            "engagement_hooks": ["hook 1", "hook 2", ...],
            "call_to_action": "clear CTA",
            "optimal_timing": "Tuesday 9-10 AM",
            "content_pillars": ["education", "inspiration", ...]
          }
        ],
        "campaign_strategy": {
          "posting_frequency": "3-4 times per week",
          "content_mix": {
            "educational": 40,
            "promotional": 20,
            "engaging": 30,
            "curated": 10
          },
          "engagement_strategy": ["strategy 1", "strategy 2", ...],
          "community_management": ["guideline 1", "guideline 2", ...]
        }
      },
      "platform_specific": {
        "character_limits": {
          "post": 3000,
          "headline": 150
        },
        "optimal_formats": ["text posts", "articles", "videos"],
        "trending_elements": ["industry insights", "thought leadership"],
        "algorithm_optimization": ["tip 1", "tip 2", ...],
        "engagement_tactics": ["tactic 1", "tactic 2", ...]
      },
      "analytics_focus": {
        "key_metrics": ["impressions", "engagement rate", "click-through rate"],
        "tracking_setup": ["setup 1", "setup 2", ...],
        "success_benchmarks": [
          {
            "metric": "engagement rate",
            "target": "5%+",
            "timeframe": "30 days"
          }
        ]
      }
    }
  ],
  "cross_platform_strategy": {
    "unified_messaging": ["consistent brand voice", "cohesive narrative"],
    "content_repurposing": [
      {
        "source_platform": "blog",
        "target_platforms": ["linkedin", "twitter"],
        "adaptation_strategy": "break into bite-sized insights"
      }
    ],
    "campaign_coordination": {
      "launch_sequence": ["step 1", "step 2", ...],
      "timing_strategy": "staggered release across platforms",
      "message_consistency": ["consistent 1", "consistent 2", ...]
    }
  },
  "influencer_collaboration": {
    "target_influencers": [
      {
        "platform": "linkedin",
        "type": "micro",
        "audience_fit": "professional audience match",
        "collaboration_type": "content collaboration",
        "expected_reach": "10K-50K"
      }
    ],
    "collaboration_templates": ["template 1", "template 2", ...],
    "partnership_strategies": ["strategy 1", "strategy 2", ...]
  },
  "community_building": {
    "engagement_strategies": ["strategy 1", "strategy 2", ...],
    "user_generated_content": ["ugc idea 1", "ugc idea 2", ...],
    "community_guidelines": ["guideline 1", "guideline 2", ...],
    "crisis_management": ["response 1", "response 2", ...]
  },
  "paid_promotion": {
    "ad_copy_variations": [
      {
        "platform": "facebook",
        "copy": "compelling ad copy",
        "target_audience": "audience segment",
        "objective": "conversion"
      }
    ],
    "targeting_strategies": ["strategy 1", "strategy 2", ...],
    "budget_recommendations": [
      {
        "platform": "linkedin",
        "budget_range": "$500-1000/month",
        "expected_reach": "5K-15K",
        "recommended_duration": "4-6 weeks"
      }
    ]
  },
  "content_calendar": {
    "weekly_schedule": [
      {
        "day": "Monday",
        "platforms": ["linkedin"],
        "content_type": "educational",
        "theme": "industry insights"
      }
    ],
    "seasonal_campaigns": ["campaign 1", "campaign 2", ...],
    "trending_opportunities": ["trend 1", "trend 2", ...]
  }
}

Create viral-worthy social content that drives engagement, builds community, and achieves business objectives.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["platforms","cross_platform_strategy","influencer_collaboration","community_building","paid_promotion","content_calendar"]),Array.isArray(b.platforms)||(b.platforms=[]),0===b.platforms.length&&(b.platforms=this.createDefaultPlatforms()),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}createDefaultPlatforms(){return[{platform:"linkedin",content:{posts:[{type:"text",content:"Professional insight adapted from main content",hashtags:["#industry","#insights","#leadership"],engagement_hooks:["Did you know...","Here's what most people miss..."],call_to_action:"What's your experience with this?",optimal_timing:"Tuesday-Thursday 9-10 AM",content_pillars:["education","thought leadership"]}],campaign_strategy:{posting_frequency:"3-4 times per week",content_mix:{educational:40,promotional:20,engaging:30,curated:10},engagement_strategy:["Ask questions","Share insights","Engage with comments"],community_management:["Respond within 2 hours","Share valuable resources"]}},platform_specific:{character_limits:{post:3e3,headline:150},optimal_formats:["text posts","articles","videos","documents"],trending_elements:["industry insights","career advice","business tips"],algorithm_optimization:["Native video","Document posts","Engagement within first hour"],engagement_tactics:["Industry hashtags","Professional storytelling","Data-driven insights"]},analytics_focus:{key_metrics:["impressions","engagement rate","click-through rate","profile views"],tracking_setup:["LinkedIn Analytics","UTM parameters","Conversion tracking"],success_benchmarks:[{metric:"engagement rate",target:"5%+",timeframe:"30 days"}]}}]}fallbackParse(a){return{platforms:[{platform:"linkedin",content:{posts:[{type:"text",content:this.extractSocialContent(a,"linkedin")||"Professional insights from our latest content. Key takeaways that every industry professional should know.",hashtags:this.extractHashtags(a)||["#industry","#insights","#professional"],engagement_hooks:["Did you know...","Here's what most people miss..."],call_to_action:"What's your take on this?",optimal_timing:"Tuesday-Thursday 9-10 AM",content_pillars:["education","thought leadership"]}],campaign_strategy:{posting_frequency:"3-4 times per week",content_mix:{educational:40,promotional:20,engaging:30,curated:10},engagement_strategy:["Ask thought-provoking questions","Share industry insights","Engage authentically"],community_management:["Respond to comments promptly","Share valuable resources","Build relationships"]}},platform_specific:{character_limits:{post:3e3,headline:150},optimal_formats:["Text posts","LinkedIn Articles","Native video","Document posts"],trending_elements:["Industry analysis","Career development","Business strategy"],algorithm_optimization:["Post during peak hours","Use native video","Encourage early engagement"],engagement_tactics:["Industry-specific hashtags","Professional storytelling","Data-driven content"]},analytics_focus:{key_metrics:["Impressions","Engagement rate","Click-through rate","Profile views"],tracking_setup:["LinkedIn Analytics","UTM tracking","Conversion pixels"],success_benchmarks:[{metric:"engagement rate",target:"5%+",timeframe:"30 days"},{metric:"click-through rate",target:"2%+",timeframe:"30 days"}]}},{platform:"twitter",content:{posts:[{type:"text",content:this.extractSocialContent(a,"twitter")||"Quick insights from our latest research. Thread with actionable tips below \uD83E\uDDF5",hashtags:this.extractHashtags(a)||["#tips","#insights","#strategy"],engagement_hooks:["\uD83E\uDDF5 THREAD:","Quick question:","Hot take:"],call_to_action:"Retweet if you agree \uD83D\uDC47",optimal_timing:"Monday-Friday 9 AM, 1 PM, 3 PM",content_pillars:["tips","insights","engagement"]}],campaign_strategy:{posting_frequency:"5-7 times per week",content_mix:{educational:35,promotional:15,engaging:35,curated:15},engagement_strategy:["Use threads for complex topics","Engage in industry conversations","Share quick tips"],community_management:["Respond quickly","Retweet relevant content","Join trending conversations"]}},platform_specific:{character_limits:{post:280,thread:25},optimal_formats:["Text tweets","Threads","Images","Videos"],trending_elements:["Industry hashtags","Current events","Quick tips"],algorithm_optimization:["Engage within first 15 minutes","Use trending hashtags","Encourage retweets"],engagement_tactics:["Thread strategies","Quote tweets","Twitter polls"]},analytics_focus:{key_metrics:["Impressions","Engagement rate","Retweets","Profile clicks"],tracking_setup:["Twitter Analytics","Link tracking","Hashtag monitoring"],success_benchmarks:[{metric:"engagement rate",target:"3%+",timeframe:"30 days"}]}}],cross_platform_strategy:{unified_messaging:["Consistent brand voice","Cohesive value proposition","Aligned key messages"],content_repurposing:[{source_platform:"blog",target_platforms:["linkedin","twitter","facebook"],adaptation_strategy:"Break long-form content into platform-appropriate snippets and insights"}],campaign_coordination:{launch_sequence:["LinkedIn article first","Twitter thread follow-up","Facebook discussion post"],timing_strategy:"Staggered release over 48 hours for maximum reach",message_consistency:["Core value proposition","Key takeaways","Call-to-action alignment"]}},influencer_collaboration:{target_influencers:[{platform:"linkedin",type:"micro",audience_fit:"Industry professionals and decision makers",collaboration_type:"Content collaboration and cross-promotion",expected_reach:"10K-50K qualified professionals"}],collaboration_templates:["Guest article exchange","Expert quote inclusion","Joint webinar promotion","Resource sharing partnership"],partnership_strategies:["Value-first approach","Mutual benefit focus","Long-term relationship building","Content co-creation"]},community_building:{engagement_strategies:["Regular community Q&A sessions","Industry discussion facilitation","User-generated content campaigns","Expert AMAs and interviews"],user_generated_content:["Success story sharing","Tips and tricks submissions","Before/after transformations","Community challenges"],community_guidelines:["Respectful professional discourse","Value-driven contributions","No spam or self-promotion","Constructive feedback culture"],crisis_management:["Acknowledge concerns promptly","Provide transparent communication","Offer solutions and next steps","Follow up on resolutions"]},paid_promotion:{ad_copy_variations:[{platform:"linkedin",copy:"Discover the strategies top professionals use to achieve exceptional results",target_audience:"Industry professionals and decision makers",objective:"lead generation"},{platform:"facebook",copy:"Transform your approach with proven strategies that deliver real results",target_audience:"Business owners and entrepreneurs",objective:"website traffic"}],targeting_strategies:["Lookalike audiences based on current customers","Interest-based targeting for industry professionals","Behavioral targeting for content engagement","Retargeting website visitors and content consumers"],budget_recommendations:[{platform:"linkedin",budget_range:"$500-1000/month",expected_reach:"5K-15K qualified professionals",recommended_duration:"4-6 weeks for optimization"},{platform:"facebook",budget_range:"$300-700/month",expected_reach:"10K-30K targeted users",recommended_duration:"6-8 weeks for comprehensive testing"}]},content_calendar:{weekly_schedule:[{day:"Monday",platforms:["linkedin"],content_type:"educational",theme:"industry insights and trends"},{day:"Tuesday",platforms:["twitter","linkedin"],content_type:"tips",theme:"actionable advice and quick wins"},{day:"Wednesday",platforms:["facebook","linkedin"],content_type:"engaging",theme:"discussion starters and community engagement"},{day:"Thursday",platforms:["twitter","linkedin"],content_type:"promotional",theme:"product/service highlights and case studies"},{day:"Friday",platforms:["linkedin","twitter"],content_type:"curated",theme:"industry news and thought leadership"}],seasonal_campaigns:["New Year goal-setting campaign","Industry conference coverage","End-of-quarter insights","Holiday networking events"],trending_opportunities:["Industry event live-tweeting","Trending hashtag participation","Current events commentary","Seasonal business topics"]}}}extractSocialContent(a,b){let c=RegExp(`${b}[\\s\\S]*?content["']?\\s*:\\s*["']([^"']+)["']`,"i"),d=a.match(c);return d?d[1]:null}extractHashtags(a){let b=a.match(/#\w+/g);return b&&b.length>0?b.slice(0,5):[]}}class n extends f{constructor(){super("Landing Page Specialist")}async execute(a,b){this.logExecution("Starting landing page optimization");let c=b.previousOutputs?.["content-editor"],d=b.previousOutputs?.["audience-analyzer"],e=b.previousOutputs?.["content-strategist"],f=b.previousOutputs?.["ai-seo-optimizer"];if(!c)throw Error("Content Editor output is required for landing page optimization");let g=this.buildPrompt(a,c,d,e,f);try{let a=await this.callLLM(g,{maxTokens:4e3,temperature:.6}),b=this.parseResponse(a);return this.logExecution("Landing page optimization completed",{sections:b.page_structure.sections.length,ctaVariations:b.conversion_optimization.cta_variations.length}),b}catch(a){throw this.logExecution("Landing page optimization failed",{error:a.message}),Error(`Landing page optimization failed: ${a}`)}}buildPrompt(a,b,c,d,e){let f=JSON.stringify(b.editedContent,null,2),g=c?`
Audience Insights:
- Primary Persona: ${c.primaryPersona.name}
- Pain Points: ${c.primaryPersona.painPoints.join(", ")}
- Goals: ${c.primaryPersona.goals.join(", ")}
- Values: ${c.primaryPersona.psychographics.values.join(", ")}
- Decision Factors: ${c.recommendations.messagingStrategy.join(", ")}
`:"",h=d?`
Content Strategy:
- Value Proposition: ${d.strategy.valueProposition}
- Key Messages: ${d.strategy.keyMessages.join(", ")}
- Call to Action: ${d.strategy.callToAction}
- Differentiators: ${d.strategy.differentiators.join(", ")}
- Benefits: ${d.contentFramework.benefitsHighlight.join(", ")}
- Social Proof: ${d.contentFramework.socialProof.join(", ")}
`:"",i=e?`
SEO Requirements:
- Primary Keywords: ${e.keywordStrategy.primaryKeywords.map(a=>a.keyword).join(", ")}
- Meta Title: ${e.onPageOptimization.metaTitle}
- Meta Description: ${e.onPageOptimization.metaDescription}
- H1 Tag: ${e.onPageOptimization.h1Tag}
`:"";return`You are a landing page conversion specialist with expertise in high-converting page design and optimization.

Create a comprehensive landing page strategy for maximum conversion rates:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}
${a.tone?`- Brand Tone: ${a.tone}`:""}
${a.brandGuidelines?`- Brand Guidelines: ${a.brandGuidelines}`:""}

${g}
${h}
${i}

**Source Content:**
${f}

Design a high-converting landing page including:

1. **Page Structure**:
   - Compelling hero section with clear value proposition
   - Strategic section layout for optimal conversion flow
   - Trust-building elements and social proof
   - Multiple conversion opportunities

2. **Conversion Optimization**:
   - Multiple headline and CTA variations for testing
   - Trust-building and credibility elements
   - Urgency and scarcity techniques
   - Objection handling and risk reduction

3. **User Experience**:
   - Optimal page flow and reading patterns
   - Mobile-first responsive design
   - Accessibility compliance
   - Performance optimization

4. **A/B Testing Strategy**:
   - Priority testing elements
   - Hypothesis-driven test variations
   - Phased testing roadmap
   - Success metrics and criteria

5. **Technical Implementation**:
   - SEO optimization requirements
   - Analytics and conversion tracking
   - Page speed optimization
   - Cross-browser compatibility

6. **Media Recommendations**:
   - Strategic visual elements
   - Image and video specifications
   - Conversion-focused design elements
   - Brand-compliant visual hierarchy

Format your response as a detailed JSON object:
{
  "page_structure": {
    "hero_section": {
      "headline": "compelling headline",
      "subheadline": "supporting subheadline",
      "value_proposition": "clear value proposition",
      "hero_image": {
        "description": "hero image description",
        "alt_text": "SEO-friendly alt text",
        "style_guide": "visual style requirements"
      },
      "cta_button": {
        "text": "action-oriented CTA",
        "color": "brand-aligned color",
        "placement": "optimal placement",
        "action": "conversion action"
      }
    },
    "sections": [
      {
        "type": "benefits",
        "title": "section title",
        "content": "section content",
        "layout": "layout description",
        "visual_elements": ["element 1", "element 2", ...],
        "conversion_elements": ["element 1", "element 2", ...]
      }
    ],
    "footer": {
      "content": "footer content",
      "links": ["link 1", "link 2", ...],
      "contact_info": ["info 1", "info 2", ...],
      "trust_signals": ["signal 1", "signal 2", ...]
    }
  },
  "conversion_optimization": {
    "headline_variations": [
      {
        "version": "headline version",
        "focus": "focus area",
        "emotional_trigger": "trigger type",
        "urgency_level": "medium"
      }
    ],
    "cta_variations": [
      {
        "text": "CTA text",
        "style": "button style",
        "placement": "placement location",
        "expected_conversion_lift": "lift percentage"
      }
    ],
    "trust_building": {
      "social_proof": ["proof 1", "proof 2", ...],
      "credibility_indicators": ["indicator 1", "indicator 2", ...],
      "risk_reduction": ["reduction 1", "reduction 2", ...],
      "testimonial_strategy": ["strategy 1", "strategy 2", ...]
    },
    "urgency_scarcity": {
      "time_based": ["time element 1", "time element 2", ...],
      "quantity_based": ["quantity element 1", "quantity element 2", ...],
      "exclusivity_based": ["exclusivity 1", "exclusivity 2", ...],
      "implementation_guide": ["guide 1", "guide 2", ...]
    }
  },
  "user_experience": {
    "page_flow": {
      "attention_sequence": ["step 1", "step 2", ...],
      "reading_pattern": "F-pattern or Z-pattern",
      "interaction_points": ["point 1", "point 2", ...],
      "conversion_path": ["path step 1", "path step 2", ...]
    },
    "mobile_optimization": {
      "responsive_design": ["requirement 1", "requirement 2", ...],
      "touch_targets": ["target 1", "target 2", ...],
      "loading_optimization": ["optimization 1", "optimization 2", ...],
      "mobile_specific_features": ["feature 1", "feature 2", ...]
    },
    "accessibility": {
      "wcag_compliance": ["compliance 1", "compliance 2", ...],
      "screen_reader_optimization": ["optimization 1", "optimization 2", ...],
      "keyboard_navigation": ["navigation 1", "navigation 2", ...],
      "color_contrast": ["contrast 1", "contrast 2", ...]
    },
    "performance": {
      "loading_speed": ["speed tip 1", "speed tip 2", ...],
      "core_web_vitals": ["vital 1", "vital 2", ...],
      "image_optimization": ["image tip 1", "image tip 2", ...],
      "script_optimization": ["script tip 1", "script tip 2", ...]
    }
  },
  "a_b_testing_strategy": {
    "primary_tests": [
      {
        "element": "headline",
        "variations": ["variation 1", "variation 2"],
        "hypothesis": "test hypothesis",
        "success_metric": "conversion rate",
        "test_duration": "2-4 weeks"
      }
    ],
    "secondary_tests": [
      {
        "element": "test element",
        "variations": ["variation 1", "variation 2"],
        "priority": "medium"
      }
    ],
    "testing_roadmap": {
      "phase_1": ["test 1", "test 2", ...],
      "phase_2": ["test 1", "test 2", ...],
      "phase_3": ["test 1", "test 2", ...],
      "success_criteria": ["criteria 1", "criteria 2", ...]
    }
  },
  "analytics_tracking": {
    "conversion_goals": [
      {
        "name": "primary conversion",
        "type": "macro",
        "value": "monetary or percentage",
        "tracking_method": "tracking setup"
      }
    ],
    "heatmap_focus": ["area 1", "area 2", ...],
    "user_flow_tracking": ["flow 1", "flow 2", ...],
    "attribution_setup": ["setup 1", "setup 2", ...]
  },
  "technical_implementation": {
    "page_speed": {
      "optimization_checklist": ["check 1", "check 2", ...],
      "critical_resources": ["resource 1", "resource 2", ...],
      "lazy_loading": ["element 1", "element 2", ...],
      "caching_strategy": ["strategy 1", "strategy 2", ...]
    },
    "seo_technical": {
      "meta_tags": {
        "title": "optimized title",
        "description": "optimized description"
      },
      "structured_data": {
        "type": "WebPage",
        "properties": {}
      },
      "canonical_url": "canonical URL",
      "robots_directives": ["directive 1", "directive 2", ...]
    },
    "conversion_tracking": {
      "google_analytics": ["setup 1", "setup 2", ...],
      "facebook_pixel": ["setup 1", "setup 2", ...],
      "custom_events": ["event 1", "event 2", ...],
      "goal_funnels": ["funnel 1", "funnel 2", ...]
    }
  },
  "content_recommendations": {
    "headline_psychology": ["principle 1", "principle 2", ...],
    "copywriting_principles": ["principle 1", "principle 2", ...],
    "visual_hierarchy": ["hierarchy 1", "hierarchy 2", ...],
    "persuasion_techniques": ["technique 1", "technique 2", ...]
  },
  "media_recommendations": [
    {
      "type": "image",
      "description": "media description",
      "placement": "placement location",
      "specifications": {
        "format": "WebP",
        "size": "1200x800",
        "optimization": "90% quality"
      },
      "purpose": "conversion purpose"
    }
  ]
}

Create a landing page strategy that maximizes conversions through psychology-driven design and data-backed optimization.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["page_structure","conversion_optimization","user_experience","a_b_testing_strategy","analytics_tracking","technical_implementation","content_recommendations","media_recommendations"]),Array.isArray(b.page_structure.sections)||(b.page_structure.sections=[]),Array.isArray(b.media_recommendations)||(b.media_recommendations=[]),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}fallbackParse(a){let b=this.extractHeadline(a)||"Transform Your Business with Our Proven Solution",c=this.extractCTA(a)||"Get Started Today";return{page_structure:{hero_section:{headline:b,subheadline:"Discover the strategy that industry leaders use to achieve exceptional results",value_proposition:"Get measurable results in 30 days or less with our proven system",hero_image:{description:"Professional hero image showing success and transformation",alt_text:`${b} - Professional solution`,style_guide:"Clean, modern design with brand colors and professional photography"},cta_button:{text:c,color:"Primary brand color (orange #FF6900)",placement:"Above the fold, prominently displayed",action:"Lead to conversion form or next step"}},sections:[{type:"benefits",title:"Why Choose Our Solution",content:"Compelling benefits that address your target audience's main pain points and desires",layout:"Three-column layout with icons and benefit statements",visual_elements:["Benefit icons","Supporting graphics","Trust indicators"],conversion_elements:["Social proof numbers","Benefit highlights","Risk reduction statements"]},{type:"features",title:"How It Works",content:"Simple 3-step process that shows exactly how to achieve desired results",layout:"Step-by-step visual process with explanatory text",visual_elements:["Process flow diagram","Feature screenshots","Interactive elements"],conversion_elements:["Ease of use emphasis","Time-to-results messaging","Feature benefit connection"]},{type:"testimonials",title:"Success Stories",content:"Real customer testimonials and case studies demonstrating proven results",layout:"Testimonial carousel with photos and detailed results",visual_elements:["Customer photos","Results graphics","Company logos"],conversion_elements:["Specific results metrics","Relatable customer stories","Authority endorsements"]},{type:"faq",title:"Frequently Asked Questions",content:"Address common objections and concerns to reduce friction",layout:"Expandable FAQ sections with clear answers",visual_elements:["Clean typography","Organized sections","Visual hierarchy"],conversion_elements:["Objection handling","Risk reduction","Confidence building"]}],footer:{content:"Professional footer with trust signals and additional conversion opportunities",links:["Privacy Policy","Terms of Service","Contact Us","About Us"],contact_info:["Phone number","Email address","Business address"],trust_signals:["Security badges","Certifications","Awards","Money-back guarantee"]}},conversion_optimization:{headline_variations:[{version:b,focus:"benefit-focused",emotional_trigger:"aspiration",urgency_level:"medium"},{version:`Get Results Fast: ${b}`,focus:"speed-focused",emotional_trigger:"urgency",urgency_level:"high"},{version:"Finally: A Solution That Actually Works",focus:"problem-focused",emotional_trigger:"frustration relief",urgency_level:"low"}],cta_variations:[{text:c,style:"Primary button with strong contrast",placement:"Hero section and multiple strategic locations",expected_conversion_lift:"15-25%"},{text:"Start Your Transformation",style:"Action-oriented with urgency",placement:"After benefits section",expected_conversion_lift:"10-20%"},{text:"Claim Your Solution Now",style:"Exclusive and immediate",placement:"After testimonials",expected_conversion_lift:"12-18%"}],trust_building:{social_proof:["Customer count","Success rate statistics","Years in business","Media mentions"],credibility_indicators:["Industry certifications","Expert team credentials","Award recognitions","Client testimonials"],risk_reduction:["Money-back guarantee","Free trial period","No long-term contracts","Secure payment processing"],testimonial_strategy:["Video testimonials","Detailed case studies","Before/after results","Industry expert endorsements"]},urgency_scarcity:{time_based:["Limited-time pricing","Deadline for bonuses","Early bird discounts","Flash sale periods"],quantity_based:["Limited spots available","Exclusive access","First come first served","Limited edition"],exclusivity_based:["VIP member access","Invitation-only","Select client program","Premium tier benefits"],implementation_guide:["Clear deadline communication","Visual countdown timers","Stock level indicators","Exclusive messaging"]}},user_experience:{page_flow:{attention_sequence:["Hero headline","Value proposition","Primary CTA","Benefits","Social proof","Secondary CTA"],reading_pattern:"F-pattern with strategic CTA placement at natural reading stops",interaction_points:["Hero CTA","Benefit exploration","Testimonial review","FAQ interaction","Final conversion"],conversion_path:["Awareness","Interest building","Consideration","Trust validation","Action"]},mobile_optimization:{responsive_design:["Mobile-first approach","Touch-friendly buttons","Readable font sizes","Optimized images"],touch_targets:["Minimum 44px buttons","Adequate spacing","Easy thumb navigation","Swipe-friendly elements"],loading_optimization:["Compressed images","Minimal scripts","Progressive loading","Fast server response"],mobile_specific_features:["Click-to-call buttons","Mobile-optimized forms","Thumb-friendly navigation","Fast checkout process"]},accessibility:{wcag_compliance:["Alt text for images","Keyboard navigation","Screen reader support","Color contrast ratios"],screen_reader_optimization:["Semantic HTML","Proper heading structure","Descriptive link text","Form labels"],keyboard_navigation:["Tab order optimization","Focus indicators","Skip navigation links","Keyboard shortcuts"],color_contrast:["WCAG AA compliance","High contrast mode","Color-blind friendly","Text readability"]},performance:{loading_speed:["Page load under 3 seconds","Optimized images","Minified CSS/JS","CDN implementation"],core_web_vitals:["LCP under 2.5s","FID under 100ms","CLS under 0.1","Performance monitoring"],image_optimization:["WebP format","Lazy loading","Responsive images","Compression optimization"],script_optimization:["Async loading","Critical path optimization","Third-party script management","Bundle optimization"]}},a_b_testing_strategy:{primary_tests:[{element:"headline",variations:["Benefit-focused","Problem-focused","Outcome-focused"],hypothesis:"Benefit-focused headlines will increase conversion by addressing desired outcomes",success_metric:"conversion rate",test_duration:"2-4 weeks"},{element:"hero_cta",variations:["Get Started Today","Start Your Transformation","Claim Your Solution"],hypothesis:"Action-oriented CTAs will outperform generic CTAs",success_metric:"click-through rate",test_duration:"2-3 weeks"}],secondary_tests:[{element:"hero_image",variations:["Product focused","People focused","Results focused"],priority:"medium"},{element:"testimonial_format",variations:["Video testimonials","Written testimonials","Case study format"],priority:"medium"}],testing_roadmap:{phase_1:["Headline optimization","Primary CTA testing","Hero section layout"],phase_2:["Benefits section optimization","Social proof placement","Form optimization"],phase_3:["Advanced personalization","Dynamic content","Behavioral triggers"],success_criteria:["5%+ conversion rate improvement","Statistical significance","Sustained performance"]}},analytics_tracking:{conversion_goals:[{name:"primary_conversion",type:"macro",value:"Lead generation or sale completion",tracking_method:"Google Analytics goal setup"},{name:"email_signup",type:"micro",value:"Newsletter or lead magnet signup",tracking_method:"Event tracking"}],heatmap_focus:["Hero section","CTA buttons","Benefits area","Testimonials section"],user_flow_tracking:["Entry point analysis","Scroll depth tracking","Exit point identification","Conversion funnel analysis"],attribution_setup:["UTM parameter tracking","Multi-touch attribution","Cross-device tracking","Channel performance analysis"]},technical_implementation:{page_speed:{optimization_checklist:["Image compression","Code minification","Server optimization","CDN setup"],critical_resources:["Hero image","Primary CSS","Essential JavaScript","Font loading"],lazy_loading:["Below-fold images","Testimonial videos","Non-critical content","Third-party widgets"],caching_strategy:["Browser caching","Server-side caching","CDN caching","Database optimization"]},seo_technical:{meta_tags:{title:b,description:"Compelling meta description that includes primary keywords and value proposition",keywords:"relevant, keywords, for, target, audience"},structured_data:{type:"WebPage",properties:{name:b,description:"Page description",url:"page URL"}},canonical_url:"https://domain.com/landing-page",robots_directives:["index","follow","noimageindex"]},conversion_tracking:{google_analytics:["Goal setup","Enhanced ecommerce","Custom dimensions","Audience tracking"],facebook_pixel:["Pixel installation","Custom events","Conversion tracking","Lookalike audiences"],custom_events:["Form submissions","Button clicks","Video engagement","Scroll milestones"],goal_funnels:["Awareness to interest","Interest to consideration","Consideration to conversion","Conversion to retention"]}},content_recommendations:{headline_psychology:["Benefit-driven messaging","Emotional triggers","Urgency creation","Specificity and numbers"],copywriting_principles:["AIDA framework","Problem-solution fit","Features vs benefits","Social proof integration"],visual_hierarchy:["F-pattern layout","Contrast for CTAs","White space usage","Progressive disclosure"],persuasion_techniques:["Reciprocity","Social proof","Authority","Scarcity","Commitment consistency"]},media_recommendations:[{type:"image",description:"Hero section background image showing success or transformation",placement:"Hero section background or featured image",specifications:{format:"WebP with JPG fallback",size:"1920x1080",optimization:"85% quality with compression"},purpose:"Create immediate visual connection and support headline message"},{type:"video",description:"Customer testimonial video or product demonstration",placement:"Testimonials section or above primary CTA",specifications:{format:"MP4 H.264",duration:"60-90 seconds",resolution:"1080p"},purpose:"Build trust and demonstrate social proof through authentic customer stories"},{type:"graphic",description:"Benefits icons and process flow illustrations",placement:"Benefits and how-it-works sections",specifications:{format:"SVG for scalability",style:"Brand-consistent icons",colors:"Brand palette"},purpose:"Enhance visual communication and improve content scannability"}]}}extractHeadline(a){for(let b of[/headline[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/hero[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i]){let c=a.match(b);if(c)return c[1]}return null}extractCTA(a){for(let b of[/cta[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/call\s*to\s*action[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,/button[\"']?\s*:\s*[\"']([^\"']+)[\"']/i]){let c=a.match(b);if(c)return c[1]}return null}}class o extends f{constructor(){super("Performance Analyst")}async execute(a,b){this.logExecution("Starting performance analysis and tracking setup");let c=b.previousOutputs?.["content-editor"],d=b.previousOutputs?.["ai-seo-optimizer"],e=b.previousOutputs?.["social-media-specialist"],f=b.previousOutputs?.["landing-page-specialist"],g=this.buildPrompt(a,c,d,e,f);try{let a=await this.callLLM(g,{maxTokens:4e3,temperature:.5}),b=this.parseResponse(a);return this.logExecution("Performance analysis completed",{primaryMetrics:b.analytics_setup.data_collection.primary_metrics.length,immediateActions:b.optimization_roadmap.immediate_actions.length}),b}catch(a){throw this.logExecution("Performance analysis failed",{error:a.message}),Error(`Performance analysis failed: ${a}`)}}buildPrompt(a,b,c,d,e){let f=b?`
Content Performance Context:
- Content Quality Score: ${b.editingReport.qualityScore}
- SEO Score: ${b.editingReport.seoScore}
- Engagement Score: ${b.editingReport.engagementScore}
- Brand Compliance: ${b.brandCompliance.voiceAlignment}
`:"",g=c?`
SEO Performance Context:
- Primary Keywords: ${c.keywordStrategy.primaryKeywords.map(a=>a.keyword).join(", ")}
- Target Metrics: ${c.performanceTracking.successMetrics.map(a=>`${a.metric}: ${a.target}`).join(", ")}
- KPIs: ${c.performanceTracking.kpis.join(", ")}
`:"",h=d?`
Social Media Performance Context:
- Platforms: ${d.platforms.map(a=>a.platform).join(", ")}
- Key Metrics: ${d.platforms.map(a=>a.analytics_focus.key_metrics.join(", ")).join(", ")}
- Success Benchmarks: ${d.platforms.flatMap(a=>a.analytics_focus.success_benchmarks.map(a=>`${a.metric}: ${a.target}`)).join(", ")}
`:"",i=e?`
Landing Page Performance Context:
- Conversion Goals: ${e.analytics_tracking.conversion_goals.map(a=>a.name).join(", ")}
- A/B Tests: ${e.a_b_testing_strategy.primary_tests.map(a=>a.element).join(", ")}
- Success Metrics: ${e.a_b_testing_strategy.primary_tests.map(a=>a.success_metric).join(", ")}
`:"";return`You are a performance analyst specializing in comprehensive analytics setup and performance optimization for ${a.contentType} content campaigns.

Create a complete performance measurement and optimization framework:

**Project Details:**
- Topic: ${a.topic}
- Target Audience: ${a.audience}
- Goals: ${a.goals}
- Content Type: ${a.contentType}

${f}
${g}
${h}
${i}

Design comprehensive performance analytics including:

1. **Analytics Setup**:
   - Complete tracking implementation across platforms
   - Custom metrics and goal configuration
   - Data collection strategy and segmentation
   - Attribution modeling and conversion tracking

2. **Performance Monitoring**:
   - Content engagement and conversion metrics
   - User behavior analysis and journey mapping
   - Channel performance evaluation
   - SEO and organic visibility tracking

3. **Reporting Framework**:
   - Executive and operational dashboards
   - Automated reporting schedules
   - Stakeholder-specific communication
   - Real-time monitoring and alerts

4. **Optimization Roadmap**:
   - Immediate actionable improvements
   - Short-term goals and initiatives
   - Long-term strategic planning
   - Resource allocation recommendations

5. **Competitive Analysis**:
   - Benchmark identification and comparison
   - Performance gap analysis
   - Competitive advantage assessment
   - Strategic positioning recommendations

6. **Success Measurement**:
   - Baseline establishment and benchmarking
   - Clear success criteria and targets
   - ROI calculation and attribution
   - Continuous improvement processes

Format your response as a detailed JSON object:
{
  "analytics_setup": {
    "tracking_implementation": {
      "google_analytics": {
        "account_setup": ["setup step 1", "setup step 2", ...],
        "goal_configuration": [
          {
            "name": "primary conversion",
            "type": "destination",
            "value": "/thank-you",
            "funnel_steps": ["step 1", "step 2", ...]
          }
        ],
        "custom_dimensions": [
          {
            "name": "traffic source",
            "scope": "session",
            "purpose": "track campaign attribution"
          }
        ],
        "enhanced_ecommerce": ["product tracking", "purchase tracking", ...]
      },
      "other_platforms": {
        "facebook_pixel": ["pixel installation", "event setup", ...],
        "linkedin_insight": ["insight tag setup", "conversion tracking", ...],
        "twitter_pixel": ["pixel configuration", "event tracking", ...],
        "hotjar_heatmaps": ["heatmap setup", "recording configuration", ...],
        "crazy_egg": ["click tracking", "scroll mapping", ...]
      },
      "custom_tracking": {
        "event_tracking": [
          {
            "category": "engagement",
            "action": "video_play",
            "label": "hero_video",
            "value": "1"
          }
        ],
        "conversion_tracking": ["form submissions", "downloads", ...],
        "attribution_modeling": ["first-click", "last-click", "multi-touch"]
      }
    },
    "data_collection": {
      "primary_metrics": [
        {
          "metric": "conversion rate",
          "definition": "percentage of visitors who complete desired action",
          "importance": "critical",
          "benchmark": "industry average 2-3%",
          "target": "5%"
        }
      ],
      "secondary_metrics": ["bounce rate", "time on page", "pages per session"],
      "cohort_analysis": ["user retention", "engagement patterns", "lifetime value"],
      "segmentation_strategy": ["traffic source", "device type", "geographic location"]
    }
  },
  "performance_monitoring": {
    "content_performance": {
      "engagement_metrics": [
        {
          "metric": "time on page",
          "tracking_method": "Google Analytics",
          "success_threshold": "3+ minutes",
          "optimization_opportunities": ["content depth", "readability", "visual elements"]
        }
      ],
      "conversion_metrics": [
        {
          "stage": "awareness",
          "metric": "page views",
          "current_benchmark": "baseline",
          "target_improvement": "25% increase",
          "optimization_strategies": ["SEO", "content promotion", "social sharing"]
        }
      ],
      "seo_metrics": {
        "organic_visibility": ["keyword rankings", "search impressions", "click-through rates"],
        "keyword_performance": ["ranking positions", "search volume", "competition analysis"],
        "technical_seo": ["page speed", "mobile friendliness", "crawl errors"],
        "content_quality": ["content depth", "readability", "user engagement"]
      }
    },
    "user_behavior": {
      "user_journey_mapping": [
        {
          "touchpoint": "landing page",
          "user_action": "first visit",
          "data_captured": ["traffic source", "time on page", "bounce rate"],
          "optimization_potential": "improve first impression and value communication"
        }
      ],
      "behavioral_patterns": ["scroll depth", "click patterns", "content consumption"],
      "drop_off_analysis": ["exit pages", "funnel abandonment", "form completion rates"],
      "engagement_patterns": ["return visits", "content sharing", "comment engagement"]
    },
    "channel_performance": {
      "organic_search": ["organic traffic", "keyword rankings", "click-through rates"],
      "paid_advertising": ["ad spend", "cost per acquisition", "return on ad spend"],
      "social_media": ["social traffic", "engagement rates", "social conversions"],
      "email_marketing": ["open rates", "click rates", "email conversions"],
      "direct_traffic": ["direct visits", "brand searches", "returning visitors"],
      "referral_traffic": ["referral sources", "link quality", "partnership performance"]
    }
  },
  "reporting_framework": {
    "dashboard_setup": {
      "executive_dashboard": {
        "kpis": ["conversion rate", "ROI", "traffic growth", "lead quality"],
        "visualization_types": ["line charts", "KPI cards", "progress bars"],
        "update_frequency": "daily",
        "stakeholder_access": ["CEO", "CMO", "VP Marketing"]
      },
      "operational_dashboard": {
        "daily_metrics": ["traffic", "conversions", "cost per acquisition"],
        "weekly_reports": ["campaign performance", "content engagement", "lead generation"],
        "real_time_alerts": ["conversion drops", "traffic spikes", "error rates"],
        "automation_rules": ["email alerts", "slack notifications", "dashboard updates"]
      },
      "campaign_specific": {
        "content_performance": ["engagement metrics", "sharing rates", "conversion attribution"],
        "channel_attribution": ["first-touch", "last-touch", "multi-touch analysis"],
        "roi_analysis": ["revenue attribution", "cost analysis", "profit margins"],
        "competitive_benchmarking": ["market share", "performance comparison", "opportunity gaps"]
      }
    },
    "reporting_schedule": {
      "daily": ["traffic summary", "conversion alerts", "performance anomalies"],
      "weekly": ["campaign performance", "content engagement", "optimization recommendations"],
      "monthly": ["comprehensive analysis", "trend identification", "strategic insights"],
      "quarterly": ["strategic review", "goal assessment", "roadmap updates"]
    },
    "stakeholder_communication": {
      "executive_summary": ["high-level KPIs", "key insights", "strategic recommendations"],
      "marketing_team": ["campaign performance", "optimization opportunities", "tactical insights"],
      "content_team": ["content performance", "engagement metrics", "content optimization"],
      "sales_team": ["lead quality", "conversion rates", "sales attribution"]
    }
  },
  "optimization_roadmap": {
    "immediate_actions": [
      {
        "action": "implement conversion tracking",
        "timeline": "1 week",
        "expected_impact": "baseline establishment",
        "effort_level": "medium",
        "dependencies": ["analytics setup", "goal definition"]
      }
    ],
    "short_term_goals": [
      {
        "goal": "improve conversion rate by 20%",
        "timeline": "3 months",
        "success_metrics": ["conversion rate", "lead quality", "cost per acquisition"],
        "required_resources": ["analytics tools", "testing platform", "design resources"]
      }
    ],
    "long_term_strategy": {
      "quarterly_objectives": ["objective 1", "objective 2", ...],
      "annual_goals": ["goal 1", "goal 2", ...],
      "strategic_initiatives": ["initiative 1", "initiative 2", ...],
      "technology_roadmap": ["tool upgrades", "platform migrations", "automation implementation"]
    }
  },
  "competitive_analysis": {
    "benchmark_identification": {
      "direct_competitors": ["competitor 1", "competitor 2", ...],
      "indirect_competitors": ["indirect 1", "indirect 2", ...],
      "industry_leaders": ["leader 1", "leader 2", ...],
      "emerging_players": ["emerging 1", "emerging 2", ...]
    },
    "performance_comparison": {
      "content_metrics": ["content volume", "engagement rates", "sharing frequency"],
      "seo_performance": ["keyword rankings", "organic visibility", "backlink profile"],
      "social_engagement": ["follower growth", "engagement rates", "content reach"],
      "conversion_rates": ["landing page performance", "funnel optimization", "user experience"]
    },
    "gap_analysis": {
      "performance_gaps": ["gap 1", "gap 2", ...],
      "opportunity_areas": ["opportunity 1", "opportunity 2", ...],
      "competitive_advantages": ["advantage 1", "advantage 2", ...],
      "strategic_recommendations": ["recommendation 1", "recommendation 2", ...]
    }
  },
  "success_measurement": {
    "baseline_establishment": {
      "current_performance": {
        "conversion_rate": "2.5%",
        "traffic_volume": "10K monthly",
        "cost_per_acquisition": "$50"
      },
      "industry_benchmarks": {
        "conversion_rate": "3.2%",
        "traffic_volume": "15K monthly",
        "cost_per_acquisition": "$45"
      },
      "historical_trends": ["trend 1", "trend 2", ...],
      "seasonal_factors": ["factor 1", "factor 2", ...]
    },
    "success_criteria": [
      {
        "timeframe": "30 days",
        "metric": "conversion rate",
        "target": "3.5%",
        "measurement_method": "Google Analytics goals",
        "success_definition": "sustained improvement with statistical significance"
      }
    ],
    "roi_calculation": {
      "cost_tracking": ["advertising spend", "tool costs", "personnel time"],
      "revenue_attribution": ["direct sales", "pipeline influence", "lifetime value"],
      "roi_formulas": ["(Revenue - Cost) / Cost", "Customer Lifetime Value", "Payback Period"],
      "payback_period": "6 months"
    }
  },
  "continuous_improvement": {
    "testing_framework": {
      "hypothesis_development": ["data-driven insights", "user feedback", "competitive analysis"],
      "test_prioritization": ["impact vs effort matrix", "statistical power", "business value"],
      "statistical_significance": ["95% confidence level", "minimum sample size", "test duration"],
      "learning_documentation": ["test results", "insights gained", "next steps"]
    },
    "optimization_cycles": {
      "data_collection_phase": ["baseline measurement", "user research", "competitive analysis"],
      "analysis_phase": ["pattern identification", "opportunity assessment", "hypothesis formation"],
      "hypothesis_formation": ["problem definition", "proposed solution", "expected outcome"],
      "testing_implementation": ["test design", "implementation", "monitoring"],
      "results_evaluation": ["statistical analysis", "business impact", "learning extraction"]
    },
    "knowledge_management": {
      "best_practices": ["proven strategies", "optimization techniques", "testing methodologies"],
      "lessons_learned": ["failed experiments", "unexpected insights", "process improvements"],
      "playbook_development": ["standard procedures", "decision frameworks", "escalation protocols"],
      "team_training": ["analytics skills", "testing methodologies", "interpretation guidelines"]
    }
  }
}

Create a comprehensive performance measurement system that drives data-driven optimization and continuous improvement.`}parseResponse(a){try{let b=this.extractJSONFromResponse(a);return this.validateRequiredFields(b,["analytics_setup","performance_monitoring","reporting_framework","optimization_roadmap","competitive_analysis","success_measurement","continuous_improvement"]),Array.isArray(b.analytics_setup.data_collection.primary_metrics)||(b.analytics_setup.data_collection.primary_metrics=[]),Array.isArray(b.optimization_roadmap.immediate_actions)||(b.optimization_roadmap.immediate_actions=[]),this.sanitizeOutput(b)}catch(b){return this.logExecution("JSON parsing failed, using fallback"),this.fallbackParse(a)}}fallbackParse(a){return{analytics_setup:{tracking_implementation:{google_analytics:{account_setup:["Create Google Analytics 4 property","Install tracking code on all pages","Configure data streams for website","Set up enhanced measurement"],goal_configuration:[{name:"primary_conversion",type:"destination",value:"/thank-you",funnel_steps:["Landing page","Form page","Confirmation"]},{name:"email_signup",type:"event",value:"email_signup",funnel_steps:["Interest shown","Form filled","Subscription confirmed"]}],custom_dimensions:[{name:"traffic_source",scope:"session",purpose:"Track detailed attribution for campaign optimization"},{name:"user_type",scope:"user",purpose:"Segment new vs returning users for personalization"}],enhanced_ecommerce:["Product impression tracking","Add to cart events","Purchase completion tracking","Refund tracking"]},other_platforms:{facebook_pixel:["Install Facebook Pixel on all pages","Set up custom conversions","Configure automatic advanced matching","Implement server-side tracking"],linkedin_insight:["Install LinkedIn Insight Tag","Set up conversion tracking","Configure audience building","Enable enhanced conversion tracking"],twitter_pixel:["Implement Twitter universal website tag","Set up conversion events","Configure audience building","Enable enhanced matching"],hotjar_heatmaps:["Install Hotjar tracking code","Set up heatmap recordings","Configure user session recordings","Create feedback polls"],crazy_egg:["Install Crazy Egg tracking","Set up click tracking","Configure scroll mapping","Enable A/B testing integration"]},custom_tracking:{event_tracking:[{category:"engagement",action:"video_play",label:"hero_video",value:"1"},{category:"conversion",action:"form_submit",label:"contact_form",value:"10"},{category:"content",action:"scroll_depth",label:"75_percent",value:"1"}],conversion_tracking:["Form submission tracking","Download completion tracking","Phone call tracking","Email click tracking"],attribution_modeling:["First-click attribution","Last-click attribution","Multi-touch attribution","Time-decay attribution"]}},data_collection:{primary_metrics:[{metric:"conversion_rate",definition:"Percentage of visitors who complete the primary desired action",importance:"critical",benchmark:"Industry average 2-5%",target:"6%+"},{metric:"cost_per_acquisition",definition:"Total marketing cost divided by number of acquisitions",importance:"critical",benchmark:"Industry average $75-150",target:"Under $100"},{metric:"return_on_investment",definition:"Revenue generated divided by marketing investment",importance:"critical",benchmark:"3:1 ROI minimum",target:"5:1 ROI"}],secondary_metrics:["Bounce rate","Time on page","Pages per session","Email open rates","Social engagement rates","Organic search visibility"],cohort_analysis:["User retention by acquisition month","Engagement patterns over time","Customer lifetime value by cohort","Conversion rate by user segment"],segmentation_strategy:["Traffic source segmentation","Device type analysis","Geographic performance","New vs returning users","Behavioral segments","Demographic analysis"]}},performance_monitoring:{content_performance:{engagement_metrics:[{metric:"time_on_page",tracking_method:"Google Analytics engagement tracking",success_threshold:"3+ minutes average",optimization_opportunities:["Content depth improvement","Reading experience enhancement","Interactive elements addition"]},{metric:"scroll_depth",tracking_method:"Custom event tracking",success_threshold:"75%+ users reach bottom",optimization_opportunities:["Content structure optimization","Visual hierarchy improvement","Call-to-action placement"]}],conversion_metrics:[{stage:"awareness",metric:"organic_traffic",current_benchmark:"Baseline establishment needed",target_improvement:"25% monthly growth",optimization_strategies:["SEO optimization","Content marketing","Social media promotion"]},{stage:"consideration",metric:"email_signups",current_benchmark:"Baseline establishment needed",target_improvement:"15% conversion rate",optimization_strategies:["Lead magnet optimization","Form UX improvement","Value proposition enhancement"]}],seo_metrics:{organic_visibility:["Keyword ranking positions","Search impression volume","Click-through rates","Featured snippet captures"],keyword_performance:["Target keyword rankings","Long-tail keyword performance","Branded search volume","Competitor keyword gaps"],technical_seo:["Page load speed metrics","Mobile usability scores","Core Web Vitals performance","Crawl error monitoring"],content_quality:["Content engagement rates","Social sharing frequency","Backlink acquisition rate","User-generated content volume"]}},user_behavior:{user_journey_mapping:[{touchpoint:"landing_page",user_action:"first_visit",data_captured:["Traffic source","Time on page","Scroll depth","Exit rate"],optimization_potential:"Improve value proposition clarity and reduce cognitive load"},{touchpoint:"content_page",user_action:"content_consumption",data_captured:["Reading time","Social shares","Return visits","Next page views"],optimization_potential:"Enhance content quality and internal linking strategy"}],behavioral_patterns:["Content consumption patterns","Navigation flow analysis","Device usage preferences","Time-based engagement patterns"],drop_off_analysis:["High-exit page identification","Form abandonment analysis","Funnel step optimization","User friction point mapping"],engagement_patterns:["Return visitor behavior","Content sharing patterns","Comment and interaction rates","Email engagement sequences"]},channel_performance:{organic_search:["Organic traffic volume and quality","Keyword ranking improvements","Click-through rate optimization","Featured snippet performance"],paid_advertising:["Ad spend efficiency and ROI","Cost per click optimization","Conversion rate by campaign","Audience targeting effectiveness"],social_media:["Social traffic and engagement","Platform-specific performance","Content virality metrics","Social conversion tracking"],email_marketing:["List growth and segmentation","Open and click-through rates","Email-to-conversion attribution","Automation sequence performance"],direct_traffic:["Brand recognition metrics","Direct visit quality","Returning user engagement","Brand search volume"],referral_traffic:["Partnership performance","Backlink quality assessment","Referral conversion rates","Influencer collaboration ROI"]}},reporting_framework:{dashboard_setup:{executive_dashboard:{kpis:["Total conversions","Cost per acquisition","Return on investment","Monthly recurring revenue"],visualization_types:["KPI summary cards","Trend line charts","Conversion funnel","Channel attribution pie chart"],update_frequency:"Daily with weekly summaries",stakeholder_access:["CEO","CMO","VP Marketing","Head of Growth"]},operational_dashboard:{daily_metrics:["Website traffic","Conversion count","Cost per click","Email performance"],weekly_reports:["Campaign performance summary","Content engagement analysis","Lead quality assessment"],real_time_alerts:["Conversion rate drops below threshold","Traffic spikes or drops","404 error increases"],automation_rules:["Send email alerts for goal completions","Slack notifications for anomalies","Weekly performance summaries"]},campaign_specific:{content_performance:["Page views by content","Engagement time analysis","Social sharing metrics"],channel_attribution:["First-touch attribution","Last-touch attribution","Multi-touch journey analysis"],roi_analysis:["Revenue by channel","Customer lifetime value","Payback period calculation"],competitive_benchmarking:["Market share tracking","Competitor performance comparison","Industry benchmark analysis"]}},reporting_schedule:{daily:["Traffic and conversion summary","Campaign performance alerts","Critical metric monitoring"],weekly:["Comprehensive performance review","Optimization recommendations","Goal progress tracking"],monthly:["Strategic analysis and insights","Trend identification","Competitive landscape review"],quarterly:["Strategic goal assessment","Budget allocation review","Technology and tool evaluation"]},stakeholder_communication:{executive_summary:["High-level KPI performance","Strategic insights and recommendations","Budget impact and ROI"],marketing_team:["Campaign optimization opportunities","Channel performance analysis","A/B test results and learnings"],content_team:["Content performance metrics","Engagement analysis","SEO performance and opportunities"],sales_team:["Lead quality assessment","Conversion funnel analysis","Sales attribution and pipeline impact"]}},optimization_roadmap:{immediate_actions:[{action:"Implement comprehensive conversion tracking",timeline:"1 week",expected_impact:"Establish baseline metrics and attribution",effort_level:"medium",dependencies:["Analytics account setup","Goal definition","Tracking code implementation"]},{action:"Set up automated reporting dashboards",timeline:"2 weeks",expected_impact:"Improve decision-making speed and accuracy",effort_level:"medium",dependencies:["Data collection setup","Stakeholder requirements","Visualization tool selection"]},{action:"Launch A/B testing program",timeline:"2 weeks",expected_impact:"10-25% improvement in conversion rates",effort_level:"high",dependencies:["Testing platform setup","Hypothesis development","Statistical significance planning"]}],short_term_goals:[{goal:"Achieve 25% improvement in conversion rate",timeline:"3 months",success_metrics:["Conversion rate increase","Statistical significance","Sustained performance"],required_resources:["A/B testing tools","Design resources","Development time"]},{goal:"Reduce cost per acquisition by 30%",timeline:"4 months",success_metrics:["CPA reduction","Maintained lead quality","ROI improvement"],required_resources:["Analytics tools","Campaign optimization","Audience refinement"]}],long_term_strategy:{quarterly_objectives:["Establish market-leading conversion rates","Build predictable customer acquisition system","Develop advanced attribution modeling"],annual_goals:["Achieve 500% ROI on marketing investment","Build automated optimization systems","Establish competitive market position"],strategic_initiatives:["AI-powered personalization implementation","Predictive analytics development","Omnichannel attribution modeling"],technology_roadmap:["Marketing automation platform upgrade","Customer data platform implementation","Advanced analytics tool adoption"]}},competitive_analysis:{benchmark_identification:{direct_competitors:["Industry competitor A","Industry competitor B","Industry competitor C"],indirect_competitors:["Alternative solution provider A","Alternative solution provider B"],industry_leaders:["Market leader A","Market leader B","Emerging leader"],emerging_players:["Startup competitor A","Startup competitor B","International player"]},performance_comparison:{content_metrics:["Content publishing frequency","Social engagement rates","Content sharing volume"],seo_performance:["Keyword ranking overlap","Organic visibility share","Backlink profile strength"],social_engagement:["Follower growth rates","Engagement rate comparison","Content reach analysis"],conversion_rates:["Landing page performance","Email signup rates","Sales conversion efficiency"]},gap_analysis:{performance_gaps:["Lower organic visibility","Reduced social engagement","Higher acquisition costs"],opportunity_areas:["Untapped keyword opportunities","Underutilized channels","Content format gaps"],competitive_advantages:["Superior user experience","Better value proposition","Stronger brand positioning"],strategic_recommendations:["Focus on long-tail SEO","Invest in video content","Develop thought leadership"]}},success_measurement:{baseline_establishment:{current_performance:{conversion_rate:"To be established",monthly_traffic:"To be established",cost_per_acquisition:"To be established",return_on_investment:"To be established"},industry_benchmarks:{conversion_rate:"2-5% industry average",monthly_traffic:"Varies by industry segment",cost_per_acquisition:"$50-200 typical range",return_on_investment:"3:1 minimum acceptable"},historical_trends:["Establish baseline trends","Identify seasonal patterns","Track growth trajectories"],seasonal_factors:["Holiday impact","Industry event cycles","Economic factors","Competitive launches"]},success_criteria:[{timeframe:"30 days",metric:"conversion_rate",target:"15% improvement from baseline",measurement_method:"Google Analytics goal conversion",success_definition:"Sustained improvement with 95% statistical confidence"},{timeframe:"90 days",metric:"cost_per_acquisition",target:"25% reduction from baseline",measurement_method:"Total marketing spend divided by conversions",success_definition:"Consistent CPA reduction while maintaining lead quality"}],roi_calculation:{cost_tracking:["Advertising spend","Tool and platform costs","Personnel time investment","Content creation costs"],revenue_attribution:["Direct sales attribution","Pipeline influence tracking","Customer lifetime value","Upsell and cross-sell impact"],roi_formulas:["(Revenue - Investment) / Investment","Customer Acquisition Cost","Lifetime Value to CAC Ratio"],payback_period:"6-12 months target for customer acquisition investment"}},continuous_improvement:{testing_framework:{hypothesis_development:["Data-driven insight generation","User research integration","Competitive analysis insights"],test_prioritization:["Impact vs effort assessment","Statistical power calculation","Business value alignment"],statistical_significance:["95% confidence level requirement","Minimum sample size calculation","Test duration optimization"],learning_documentation:["Test results repository","Insights database","Failed experiment learnings"]},optimization_cycles:{data_collection_phase:["Performance baseline establishment","User behavior analysis","Competitive research"],analysis_phase:["Pattern identification","Opportunity assessment","Root cause analysis"],hypothesis_formation:["Problem statement definition","Solution hypothesis","Expected outcome prediction"],testing_implementation:["Test design and setup","Implementation and monitoring","Data collection"],results_evaluation:["Statistical significance testing","Business impact assessment","Learning extraction"]},knowledge_management:{best_practices:["Proven optimization strategies","Testing methodologies","Performance benchmarks"],lessons_learned:["Failed experiment insights","Unexpected discoveries","Process improvements"],playbook_development:["Standard operating procedures","Decision-making frameworks","Escalation protocols"],team_training:["Analytics skills development","Testing methodology training","Data interpretation guidelines"]}}}}}class p{constructor(){this.agents=new Map([["market-researcher",new g],["audience-analyzer",new h],["content-strategist",new i],["ai-seo-optimizer",new j],["content-writer",new k],["content-editor",new l],["social-media-specialist",new m],["landing-page-specialist",new n],["performance-analyst",new o]])}async executeAgent(a,b,c){let d=this.agents.get(a);if(!d)throw Error(`Agent not found: ${a}`);console.log(`Executing agent: ${a}`);try{let e=await d.execute(b,c);return console.log(`Agent ${a} completed successfully`),e}catch(b){throw console.error(`Agent ${a} failed:`,b),b}}getAvailableAgents(){return Array.from(this.agents.keys())}async healthCheck(){let a=new Map;for(let[b,c]of this.agents)try{"function"==typeof c.healthCheck&&await c.healthCheck(),a.set(b,!0)}catch(c){console.error(`Health check failed for agent ${b}:`,c),a.set(b,!1)}return a}}class q{constructor(){}async evaluateContent(a){return await this.calculateQualityScores(a)}async calculateQualityScores(a){let b=this.calculateReadabilityScore(a.content),c=this.calculateSEOScore(a),d=this.calculateBrandAlignment(a),e=this.calculateOriginality(a),f=.25*b+.3*c+.25*d+.2*e;return{overall:Math.round(100*f)/100,readability:Math.round(100*b)/100,seo:Math.round(100*c)/100,brandAlignment:Math.round(100*d)/100,originality:Math.round(100*e)/100,evaluatedAt:new Date,recommendations:this.generateRecommendations(f,b,c,d,e)}}calculateReadabilityScore(a){if(!a)return 0;let b=a.split(/[.!?]+/).filter(a=>a.trim().length>0),c=a.split(/\s+/).filter(a=>a.length>0),d=c.length/Math.max(b.length,1),e=c.reduce((a,b)=>a+b.length,0)/Math.max(c.length,1),f=.8;return d>=10&&d<=20?f+=.1:f-=.01*Math.abs(d-15),e>=4&&e<=6?f+=.1:f-=.02*Math.abs(e-5),Math.max(.3,Math.min(1,f))}calculateSEOScore(a){let b=.7;if(a.seoKeywords&&a.seoKeywords.length>0){b+=.2;let c=a.content.toLowerCase();b+=a.seoKeywords.filter(a=>c.includes(a.toLowerCase())).length/a.seoKeywords.length*.1}return a.title&&a.title.length>=30&&a.title.length<=60&&(b+=.1),a.summary&&a.summary.length>=120&&a.summary.length<=160&&(b+=.1),Math.max(.3,Math.min(1,b))}calculateBrandAlignment(a){let b=.85,c=["professional","expertise","solution","innovative","quality"],d=a.content.toLowerCase();return b+=c.filter(a=>d.includes(a)).length/c.length*.1,Math.max(.3,Math.min(1,b-=.1*["awesome","cool","dude","totally"].filter(a=>d.includes(a)).length))}calculateOriginality(a){return .95}generateRecommendations(a,b,c,d,e){let f=[];return b<.6&&f.push("Improve readability by using shorter sentences and simpler words"),c<.7&&f.push("Optimize SEO by adding more relevant keywords and improving meta descriptions"),d<.8&&f.push("Ensure content aligns better with brand voice and messaging guidelines"),e<.9&&f.push("Add more unique insights and original perspectives"),a>=.9?f.push("Excellent quality! Content is ready for publication"):a>=.8?f.push("Good quality content with minor improvements needed"):f.push("Content needs significant improvement before publication"),f}}class r{constructor(){this.storage=new Map}async saveAgentOutput(a,b,c){let d=`${a}_agent_${b}`;this.storage.set(d,{workflowId:a,agentId:b,result:c,timestamp:new Date,type:"agent_output"})}async getAgentOutput(a,b){let c=`${a}_agent_${b}`;return this.storage.get(c)?.result}async saveFinalContent(a,b){let c=`${a}_final_content`;this.storage.set(c,{workflowId:a,content:b,timestamp:new Date,type:"final_content"})}async getFinalContent(a){let b=`${a}_final_content`;return this.storage.get(b)?.content||null}async saveQualityReport(a,b){let c=`${a}_quality_report`;this.storage.set(c,{workflowId:a,scores:b,timestamp:new Date,type:"quality_report"})}async getQualityReport(a){let b=`${a}_quality_report`;return this.storage.get(b)?.scores||null}async saveApproval(a,b){let c=`${a}_approval`;this.storage.set(c,{workflowId:a,approvalData:b,timestamp:new Date,type:"approval"})}async getApproval(a){let b=`${a}_approval`;return this.storage.get(b)?.approvalData||null}async saveRevisionRequest(a,b){let c=`${a}_revision`;this.storage.set(c,{workflowId:a,revisionData:b,timestamp:new Date,type:"revision_request"})}async getRevisionRequest(a){let b=`${a}_revision`;return this.storage.get(b)?.revisionData||null}async getAllWorkflowData(a){let b={agentOutputs:{},finalContent:null,qualityReport:null,approval:null,revisionRequest:null};for(let[c,d]of this.storage.entries())if(c.startsWith(a))switch(d.type){case"agent_output":b.agentOutputs[d.agentId]=d.result;break;case"final_content":b.finalContent=d.content;break;case"quality_report":b.qualityReport=d.scores;break;case"approval":b.approval=d.approvalData;break;case"revision_request":b.revisionRequest=d.revisionData}return b}async deleteWorkflowData(a){Array.from(this.storage.keys()).filter(b=>b.startsWith(a)).forEach(a=>this.storage.delete(a))}async getWorkflowHistory(){let a=new Set;for(let b of this.storage.keys()){let c=b.split("_")[0];a.add(c)}return Array.from(a)}}class s{static{this.instances=new Map}constructor(a){this.id=this.generateId(),this.request=a,this.orchestrator=new p,this.qualityController=new q,this.storage=new r,this.status={id:this.id,status:"pending",progress:0,agents:this.initializeAgents(),startTime:new Date},s.instances.set(this.id,this)}static getInstance(a){return s.instances.get(a)}generateId(){return`workflow-${Date.now()}-${Math.random().toString(36).substr(2,9)}`}initializeAgents(){return this.getAgentPipeline().map(a=>({agentId:a.id,status:"pending",progress:0}))}getAgentPipeline(){let a=[{id:"market-researcher",name:"Market Researcher",description:"Analyzing market trends and competitor landscape",color:"blue",estimatedTime:3,dependencies:[]},{id:"audience-analyzer",name:"Audience Analyzer",description:"Analyzing target audience and creating persona insights",color:"purple",estimatedTime:2,dependencies:["market-researcher"]},{id:"content-strategist",name:"Content Strategist",description:"Creating comprehensive content strategy and outline",color:"indigo",estimatedTime:3,dependencies:["audience-analyzer"]},{id:"ai-seo-optimizer",name:"AI SEO Optimizer",description:"Optimizing for traditional and AI search engines",color:"green",estimatedTime:2,dependencies:["content-strategist"]},{id:"content-writer",name:"Content Writer",description:"Writing engaging, conversion-focused content",color:"orange",estimatedTime:5,dependencies:["ai-seo-optimizer"]},{id:"content-editor",name:"Content Editor",description:"Reviewing and polishing content for quality",color:"red",estimatedTime:3,dependencies:["content-writer"]}];return"landing"===this.request.contentType&&a.push({id:"landing-page-specialist",name:"Landing Page Specialist",description:"Optimizing for conversion and user experience",color:"yellow",estimatedTime:4,dependencies:["content-editor"]}),("social"===this.request.contentType||this.request.platforms?.length)&&a.push({id:"social-media-specialist",name:"Social Media Specialist",description:"Adapting content for social platforms",color:"pink",estimatedTime:3,dependencies:["content-editor"]}),a.push({id:"performance-analyst",name:"Performance Analyst",description:"Setting up analytics and success metrics",color:"cyan",estimatedTime:2,dependencies:["content-editor"]}),a}getEstimatedTime(){return this.getAgentPipeline().reduce((a,b)=>a+b.estimatedTime,0)}async start(){return this.status.status="running",this.executeWorkflow().catch(a=>{console.error("Workflow execution failed:",a),this.status.status="failed"}),this.id}async executeWorkflow(){let a=this.getAgentPipeline(),b=0,c=100/a.length;for(let d of a){if(!this.checkDependencies(d))throw Error(`Dependencies not met for agent: ${d.id}`);let a=this.status.agents.findIndex(a=>a.agentId===d.id);-1!==a&&(this.status.agents[a].status="running",this.status.agents[a].startTime=new Date,this.status.currentAgent=d.id);try{let e=await this.orchestrator.executeAgent(d.id,this.request,this.getAgentContext());-1!==a&&(this.status.agents[a].status="completed",this.status.agents[a].endTime=new Date,this.status.agents[a].progress=100,this.status.agents[a].output=e,this.status.agents[a].duration=this.status.agents[a].endTime.getTime()-this.status.agents[a].startTime.getTime()),b+=c,this.status.progress=Math.min(b,100),await this.storage.saveAgentOutput(this.id,d.id,e)}catch(b){throw -1!==a&&(this.status.agents[a].status="failed",this.status.agents[a].error=b instanceof Error?b.message:"Unknown error"),b}}await this.generateFinalContent(),await this.runQualityControl(),this.status.status="completed",this.status.endTime=new Date,this.status.progress=100}checkDependencies(a){return a.dependencies.every(a=>{let b=this.status.agents.find(b=>b.agentId===a);return b&&"completed"===b.status})}getAgentContext(){let a=this.status.agents.filter(a=>"completed"===a.status),b={request:this.request,previousOutputs:{}};return a.forEach(a=>{a.output&&(b.previousOutputs[a.agentId]=a.output)}),b}async generateFinalContent(){let a=this.status.agents.filter(a=>"completed"===a.status&&a.output).reduce((a,b)=>(a[b.agentId]=b.output,a),{}),b={id:`content-${this.id}`,title:a["content-strategist"]?.title||this.request.topic,content:a["content-writer"]?.content||"",summary:a["content-strategist"]?.summary||"",seoKeywords:a["ai-seo-optimizer"]?.keywords||[],readabilityScore:0,platforms:this.generatePlatformContent(a)};this.status.content=b,await this.storage.saveFinalContent(this.id,b)}generatePlatformContent(a){let b=[];return a["social-media-specialist"]&&b.push(...a["social-media-specialist"].platforms),a["landing-page-specialist"]&&b.push({platform:"landing-page",content:a["landing-page-specialist"].content,mediaRecommendations:a["landing-page-specialist"].mediaRecommendations}),b}async runQualityControl(){if(!this.status.content)return;let a=await this.qualityController.evaluateContent(this.status.content);this.status.qualityScores=a,await this.storage.saveQualityReport(this.id,a)}async getStatus(){return{...this.status}}async getContent(){return this.status.content}async getQualityScores(){return this.status.qualityScores}async approveContent(a){if("completed"!==this.status.status)throw Error("Content must be completed before approval");this.status.status="completed";let b={approved:!0,approvedAt:new Date,feedback:a,approvedBy:"Quality Control"};return await this.storage.saveApproval(this.id,b),b}async rejectContent(a){if("completed"!==this.status.status)throw Error("Content must be completed before rejection");let b={approved:!1,rejectedAt:new Date,feedback:a,rejectedBy:"Quality Control",reason:a};return await this.storage.saveApproval(this.id,b),b}async requestRevision(a){if("completed"!==this.status.status)throw Error("Content must be completed before requesting revision");let b={revisionRequested:!0,requestedAt:new Date,feedback:a,requestedBy:"Quality Control",revisionNotes:a};return await this.storage.saveRevisionRequest(this.id,b),b}async getQualityReport(){if(!this.status.content||!this.status.qualityScores)throw Error("Content and quality scores must be available");let a=this.status.agents.filter(a=>"completed"===a.status&&a.output).map(a=>({agentId:a.agentId,agentName:this.getAgentName(a.agentId),output:a.output,duration:a.duration,completedAt:a.endTime}));return{workflowId:this.id,content:this.status.content,qualityScores:this.status.qualityScores,agentFeedback:a,overallStatus:this.status.status,completedAt:this.status.endTime,totalDuration:this.status.endTime?this.status.endTime.getTime()-this.status.startTime.getTime():0,agentCount:this.status.agents.length,successfulAgents:this.status.agents.filter(a=>"completed"===a.status).length}}getAgentName(a){let b=this.getAgentPipeline().find(b=>b.id===a);return b?.name||a}}},1997:()=>{},6909:()=>{}};