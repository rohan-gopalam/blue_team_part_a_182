// Static insights data
export const insightsData = {
  homework: {
    "HW0": {
      count: 14,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Questions 2, 3, and 4
- Models like DeepSeek v3.2, Claude Opus, and Grok solved these consistently
- Strong analytical reasoning demonstrated across platforms

**Challenging problems:** Question 5, especially parts (b) and (d)
- GPT-4o and Gemini Flash had difficulty with ReLU elbow orientation
- Sign reasoning proved problematic for multiple models

**Approaches & Methodologies:**
- Step-by-step reasoning emerged as the dominant strategy
- Claude Opus showed unique behavior by using Bash to compile Markdown outputs
- Kimi needed explicit guidance and supervision for detailed work
- Structured problem-solving required active prompting

**Performance Patterns:**
- DeepSeek excelled at linear algebra and vector calculus
- Gemini Pro effectively parsed screenshot text and connected related subparts
- GPT-4o and Qwen struggled with qualitative analysis
- Grok and Claude Sonnet consistently accurate on problems 2-4

**Key Observations:**
- Multi-variable updates presented significant challenges
- DeepSeek required re-prompting for Problem 5(d) to derive correct expressions
- Claude Opus demonstrated autonomous tool usage (unexpected agentic behavior)
- Gemini Flash showed weakness in graphical intuition
- Most models needed explicit guidance for complete solutions`
    },
    "HW1": {
      count: 11,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Single-variable algebra (5a-b)
- Gemma 3 handled these without issues

**Challenging problems:** Linear algebra operations
- Matrix inverses and dimensional constraints proved difficult
- Gemma 3 struggled with matrix multiplication requirements

**Approaches & Methodologies:**
- Step-by-step prompting improved solution quality
- Direct text input outperformed PDF uploads for Gemini Pro
- Structured problem interpretation enhanced accuracy
- Explicit problem statements yielded better results

**Performance Patterns:**
- ChatGPT-5.1 achieved high accuracy, successfully one-shotting all problems
- Claude Sonnet 4.5 made subtle errors in complex derivations
- Mistral performed well except on matrix calculations
- Clear gap in handling specific mathematical operations across models

**Key Observations:**
- Hallucinations and unfounded assumptions were common issues
- Gemini Pro provided valuable geometric interpretations
- ChatGPT-5.1 demonstrated ability to infer follow-up questions
- Potential academic integrity concerns with proactive answer generation
- Deep explanations added value to solutions`
    },
    "HW2": {
      count: 11,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Question 5
- Gemini and Mistral solved distributed training problems effortlessly
- Computational scaling reasoning straightforward for most models

**Challenging problems:** Question 1(b)
- L-infinity penalty typo confused Kimi and Qwen3-Max
- Required manual intervention and corrections

**Approaches & Methodologies:**
- One-shot techniques dominated (complete PDF with minimal context)
- Structured prompts with step-by-step breakdowns
- Interactive engagement with hints and corrections
- Deepseek and Mistral used minimal context successfully

**Performance Patterns:**
- Gemini Pro consistently correct on first attempt
- GPT-5.1 showed strong reasoning, minor formatting issues only
- Models effectively tackled optimization problems
- High success rate on distributed training questions

**Key Observations:**
- Several models identified and corrected problem statement errors
- Gemini spotted the 1(b) typo independently
- GPT-5 recognized ill-posed elements in Problem 2(b)
- Claude demonstrated strong symbolic reasoning but overcomplicated initially
- Mistral needed explicit guidance to deviate from textbook patterns`
    },
    "HW3": {
      count: 11,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Questions 1 and 3
- Gemini Pro and Claude Opus handled Gaussian policy-gradient well
- Maximal Update Parameterization accessible to most models

**Challenging problems:** Q1b, Q5b, and figure interpretation
- Claude Sonnet made mathematical calculation errors
- Gemini Flash struggled with visual data in Question 3

**Approaches & Methodologies:**
- Explicit derivation steps crucial for success
- Gemini Pro used analogies (sound equalizer) to clarify concepts
- Claude Opus and GPT-4o employed first-principles derivation
- Full problem statements with screenshots common
- Prompting for intermediate step explanations

**Performance Patterns:**
- GPT-5.1 and Claude Opus excelled at zero-shot tasks
- Gemini Pro handled probability, calculus, and optimization effectively
- Computational tasks favored over conceptual reasoning
- Figure-based interpretation proved challenging

**Key Observations:**
- GPT-5.1 praised for error-free reasoning and alternative valid approaches
- Gemini Flash made confident but incorrect assumptions from figures
- Mistral's Le Chat referenced wrong tables/formulas
- Grok overextended responses when given feedback
- Prompt engineering significantly impacted outcomes`
    },
    "HW4": {
      count: 10,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Question 1
- Mistral and Grok one-shotted effectively
- Minor notation/constant issues only

**Challenging problems:** Question 2(e)
- Multiple models struggled consistently
- Claude Sonnet 4.5 required several attempts

**Approaches & Methodologies:**
- Sequential prompting through one-shot approaches
- Claude Sonnet 4.5 used individual question screenshots for focus
- DeepSeek tested various input formats
- Explicit notation instructions necessary

**Performance Patterns:**
- GPT-5 and Gemini Pro strong on conceptual questions
- Gemini 3.0 Pro showed improved reading over 2.5 Pro
- Mistral excelled with structured responses
- Needed clarification on unspecified conventions

**Key Observations:**
- Qwen struggled with reasoning, especially on 2(e)
- Models demonstrated self-correction abilities
- Gemini Pro adjusted responses when differing from solutions
- DeepSeek improved with multimodal (text + image) input
- Claude defaulted to Big-O instead of required cmnp format`
    },
    "HW5": {
      count: 13,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Convolution and normalization
- Claude Opus 4.5 achieved 100% success rate
- Weight sharing and translation equivariance well-understood

**Challenging problems:** Dropout regularization derivations
- Gemini Flash occasionally omitted reasoning
- Deeper logical steps required extra prompting

**Approaches & Methodologies:**
- Structured prompts: "understand → summarize → derive → implement"
- LaTeX formatting improved GPT-Oss performance
- Chain of thought methodology frequently employed
- ChatGPT 5.1 used incremental problem-solving steps

**Performance Patterns:**
- Claude Opus 4.5 and GPT-5.1 excelled at convolutional networks
- Batch normalization tasks handled accurately
- Gemini Flash strong on math, occasionally lacked precision
- DeepSeek struggled with multi-modal inputs but strong conceptually

**Key Observations:**
- Variable ability on long-horizon tasks
- Claude AI overcomplicated during extended derivations
- Kimi exhibited self-correction capabilities
- High sensitivity to input structure (especially GPT-Oss)
- Gemini 2.5 Pro parsed screenshots effectively`
    },
    "HW6": {
      count: 13,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Mathematical derivations and conceptual questions
- Gemini Pro and GPT-5.1 solved with minimal intervention

**Challenging problems:** Q3c(iii) - graph update equations
- Claude Opus and DeepSeek hallucinated neighborhood structure
- Visual graph interpretation problematic

**Approaches & Methodologies:**
- Zero-shot or one-shot prompting dominant
- Problem restating followed by structured reasoning
- Qwen and DeepSeek used clarification before solving
- Context outlining before diving into solutions

**Performance Patterns:**
- GPT-5.1 and Claude effective with mathematical derivations
- Strong conceptual explanations with detailed reasoning
- Mistral and Qwen weak on visual interpretation
- Hallucinations common with diagrams and graphs

**Key Observations:**
- Visual data handling major challenge across models
- Mistral and GPT-5 struggled with graph/table interpretation
- Gemini Pro requested clarification to avoid hallucinations
- GPT-5.1 and Claude showed verbosity trend
- Accurate but unnecessarily lengthy explanations`
    },
    "HW7": {
      count: 13,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Multiple choice questions
- Grok and Mistral correct on first attempts

**Challenging problems:** Detailed mathematical derivations
- Optimality conditions and SVD math difficult
- Mistral struggled with Question 4 (model accuracies/training times)
- Qwen had issues with sophisticated SVD operations

**Approaches & Methodologies:**
- One-shot problem solving common
- DeepSeek and Claude Opus handled derivations cleanly
- Re-prompting needed for detailed explanations
- AM-GM inequality technique used by GPT-5

**Performance Patterns:**
- GPT-5 and GPT-5.1 excelled at conceptual understanding
- Claude Opus reliable for linear algebra and optimization
- Qwen and Kimi solid on basics, weak on complex theory
- Gap evident in sophisticated mathematical reasoning

**Key Observations:**
- Variable ability to recognize and correct user errors
- GPT-5 caught deliberate RNN orthogonal initialization mistake
- DeepSeek resisted hallucinations effectively
- Models relied on memorized answers without showing derivations
- Need for more explicit derivation steps in responses`
    },
    "HW8": {
      count: 14,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Direct mathematical derivations
- Perplexity and Gemini Pro performed well
- SSM kernels and linear purification understood

**Challenging problems:** Question 1c - critical path length
- Claude Sonnet and Claude Opus struggled with final terms
- DeepSeek and Grok confused total work vs. critical path

**Approaches & Methodologies:**
- "Step-by-step" prompts encouraged logical reasoning
- Perplexity and DeepSeek demonstrated self-diagnosis
- DeepSeek's self-checking often ineffective
- Targeted follow-up prompts needed for refinement

**Performance Patterns:**
- Gemini 3 Pro and GPT-5.1 excelled at algebraic reasoning
- Minimal guidance needed for correct results
- Mistral and Claude Opus struggled with time complexity
- Strong concept explanation but needed guidance on computational complexity

**Key Observations:**
- Tendency to overcomplicate solutions
- GPT-5.1 introduced unnecessary variables
- Difficulty independently identifying mistakes
- DeepSeek required external hints for Problem 1c corrections
- Qwen and Kimi K2 strong on multiple-choice and fill-in-blank formats`
    },
    "HW9": {
      count: 16,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Questions 1-4
- Kimi and Gemma solved correctly on first attempt
- Simple manipulation handled easily

**Challenging problems:** Question 6
- GPT-o3 made kernel function errors
- DeepSeek confused matrix dimensions

**Approaches & Methodologies:**
- Structured prompts with four-step problem-solving (GPT-5.1)
- Questions fed one at a time to avoid error compounding
- Restating problems to prevent hallucinations
- Step-by-step breakdowns emphasized

**Performance Patterns:**
- Mistral achieved 99% accuracy, zero arithmetic errors
- Grok 4.1 effective on transformer architectures
- Clear reasoning and derivations for attention visualization
- Gemini Pro provided detailed explanations unprompted

**Key Observations:**
- Models struggled with academic integrity prompts
- GPT-5.1 initially hesitant to answer directly
- Grok and Qwen needed nudges for specific dimensions
- Mistral's pedagogical approach suggests educational tool potential
- Precise prompting crucial for success`
    },
    "HW10": {
      count: 13,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Mathematical derivations
- GPT-5 and Gemini Pro one-shotted kernelized linear attention
- Complex algebraic tasks handled well

**Challenging problems:** Computational complexity analysis
- GPT-4o and Mistral ignored or incorrectly included terms
- Hidden costs in kernelized attention problematic

**Approaches & Methodologies:**
- Chain-of-thought reasoning emphasized
- Step-by-step derivations standard
- Visual results and external PDFs uploaded
- DeepSeek's logical flow particularly impressive

**Performance Patterns:**
- DeepSeek and GPT-5 excelled on theoretical questions
- Accurate solutions on first attempt common
- Mistral and Gemini Flash struggled with algorithmic complexity
- Overconfidence in incorrect answers observed

**Key Observations:**
- Hallucination tendency with verbose incorrect explanations
- Gemini Flash repeated incorrect assertions (triplet loss, harmonic embeddings)
- Claude Opus and GPT-5.1 learned from feedback
- Demonstrated adaptability and deep architectural understanding
- Gemini Pro analyzed FaceNet's parameters vs. FLOPs effectively`
    },
    "HW11": {
      count: 10,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Conceptual and proof-based questions
- LoRA adjustments (Problem 1) and soft prompting (Problem 2)
- GPT-5.1, Claude Opus, Gemini Pro provided clear explanations

**Challenging problems:** Numerical calculations
- Fermi estimation (Question 6) difficult for LLaMA
- Mistral hallucinated numerical facts

**Approaches & Methodologies:**
- Clear, structured guidance with step-by-step reasoning
- Gemini Flash used incremental prompts
- Claude Opus compiled markdown for answer key comparison
- Additional context and corrections for steering

**Performance Patterns:**
- GPT-5.1 excelled at conceptual understanding and derivations
- Claude Opus and Gemini Pro reliable on conceptual questions
- Gemini Pro achieved 100% zero-shot accuracy
- Mistral and LLaMA struggled with numerical accuracy

**Key Observations:**
- Qwen and Deepseek needed user intervention for corrections
- KIMI K2 had OCR errors and variable misinterpretation
- Correct methodologies sometimes compensated for numerical errors
- Prompt structure significantly impacted performance
- Narrower prompts yielded more reliable results`
    },
    "HW12": {
      count: 10,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Questions 1 and 2
- Grok and Gemini Pro succeeded in one-shot
- Transformer initialization issues identified correctly

**Challenging problems:** Question 3 - visual interpretation
- Qwen and GPT-5 struggled with graph reading
- Manual matching or screenshots required

**Approaches & Methodologies:**
- Models treated as collaborative partners
- Step-by-step prompting and concept re-teaching
- GPT-5.1 broke down concepts before applying to questions
- Prompting for justification at each step

**Performance Patterns:**
- Claude Opus and Gemini Pro excelled at mechanical reasoning
- Correct, concise answers on variance scaling and KL Divergence
- GPT-5 and Mistral struggled with graph interpretation
- Hallucinations when visual data insufficient

**Key Observations:**
- Claude Opus settled for simplified solutions without deeper prompting
- GPT-5.1 identified question ambiguities effectively
- Mistral and Grok showed strong domain knowledge
- Required careful management to avoid hallucinations
- Visual information completeness critical for accuracy`
    },
    "HW13": {
      count: 7,
      content: `**Problem Difficulty Assessment:**

**Easier problems:** Question 1
- GPT-4o solved quickly despite minor notation issues

**Challenging problems:** Question 2, parts f and g
- GPT-4o stalled at 30% completion
- Complexity and length proved challenging

**Approaches & Methodologies:**
- Breaking problems into sub-questions
- Step-by-step derivations leveraged
- DeepSeek excelled at distribution derivation
- Gemini Pro acted as "technical partner" with structured approach

**Performance Patterns:**
- DeepSeek strong on probability and optimization
- Sound mathematical justifications for DDPM/DDIM
- Qwen and Gemini Pro excelled at structured optimization theory
- Thorough, accurate answers with minimal errors

**Key Observations:**
- GPT-4o struggled with context management in lengthy questions
- Image-based input potentially problematic
- GPT-5.1 showed quality degradation as questions progressed
- Qwen inferred problem content with minimal context
- Effective handling of incomplete information demonstrated`
    }
  },
  models: {
    "Claude": {
      count: 3,
      content: `**Where It Excels:**
- Non-coding reasoning and mathematical problem-solving (HW6, HW2)
- Molecular graph analysis and CNN-GNN comparisons with detailed explanations
- Strong symbolic reasoning - derives analytical solutions accurately
- Formal reasoning and conceptual explanations

**Limitations:**
- Overcomplicates solution strategies unnecessarily
- Fails to identify obvious solutions in long-horizon tasks (HW5)
- Needs guidance to find simpler approaches
- Verbose with excessive explanations

**User Experience:**
- Reliable for straightforward questions
- Arguments align with correct solutions when given proper guidance
- Generates high-quality study notes requiring minimal editing
- Best with some user direction for complex tasks`
    },
    "Claude Opus 4.5": {
      count: 11,
      content: `**Where It Excels:**
- One-shot algebraic and mathematical solutions
- Variance scaling with precise explanations (HW12)
- Mathematical derivations and convergence analysis (13/14 correct in HW6)
- Perfect success rate on convolution networks and batch normalization (HW5)
- Neat markdown formatting for easy comparison

**Limitations:**
- Shallow initial responses on conceptual questions
- Goes on autopilot without exploring alternatives
- Makes incorrect assumptions (GPU settings in HW11)
- Overcomplicates simple problems (HW8 problem 1c)
- Requires additional prompting for refined reasoning

**User Experience:**
- "Very impressed" with autonomous math handling
- "Incredible strength" in one-shotting complex questions
- Minimal re-prompting needed
- Handles complex algebraic chains well
- Strong on structured problems, weaker on conceptual depth`
    },
    "Claude Sonnet 4.5": {
      count: 8,
      content: `**Where It Excels:**
- First-attempt accuracy on multiple assignments
- Complete solutions with generated plots (HW0)
- Complex derivations like KL minimization (HW13)
- Detailed mathematical reasoning (HW10)

**Limitations:**
- Subtle mistakes with constants and assumptions
- Convergence-rate derivation errors (HW1)
- Sign errors in signal processing (HW4)
- Notation convention issues
- Confident even when incorrect

**User Experience:**
- Useful for brainstorming proof structures
- Good for confirming intuition
- Cannot produce fully rigorous solutions independently
- Requires human oversight
- Verbose explanations can overwhelm
- Hallucinations of intermediate steps`
    },
    "DeepSeek": {
      count: 21,
      content: `**Where It Excels:**
- Chain-of-thought reasoning
- Step-by-step mathematical derivations
- Linear algebra (matrix dimensions, derivatives)
- Optimal policy forms and algebraic manipulations
- DDPM/DDIM distributions and DPO derivations
- Self-corrects when prompted

**Limitations:**
- Inconsistent formatting in longer responses
- Omits necessary steps
- Simplifies qualitative analysis with numerical examples instead of general inequalities
- Misinterprets small prompt details
- Needs explicit prompts to address incomplete solutions

**User Experience:**
- "Impressive chain-of-thought reasoning"
- "Strong proficiency in theoretical ML questions"
- Clear reasoning and mathematical accuracy
- Resilient in refining answers with guidance
- Strategic trade-off: leaves solutions unsimplified to avoid calculation errors`
    },
    "GPT-4o": {
      count: 8,
      content: `**Where It Excels:**
- Quick solutions to straightforward problems
- Strong deep learning conceptual understanding (HW8)
- High-level conceptual explanations
- Clear insights on autoencoders and PCA (HW7)

**Limitations:**
- Skips detailed logic despite instructions
- Struggles with computational complexity questions
- Fails to account for hidden costs in derivations (HW10)
- Poor visual data interpretation (graphs/tables)
- Resists format instructions

**User Experience:**
- "Insightful and deepened my understanding"
- Quick to find correct answers
- High variance: excels at one-shot but struggles with multi-part tasks
- Performance deteriorates with repeated failures (HW3)
- Overcomplicated explanations`
    },
    "GPT-5": {
      count: 11,
      content: `**Where It Excels:**
- Non-coding theoretical problems with minimal prompts
- One-shot solutions (kernelized linear attention in HW10)
- Complex derivations matching staff solutions (HW7)
- Detects errors and inconsistencies
- No hallucinations in strong areas

**Limitations:**
- Incorrect Python code for matrix problems (HW4)
- Cannot parse graph images accurately (HW6)
- Slow reasoning (20+ minute responses)
- Struggles with visual interpretation
- Skips crucial steps requiring additional prompting

**User Experience:**
- Helpful and reliable for non-coding tasks
- Intuitive yet technically rigorous
- Caught theoretical traps showing deep comprehension
- Performance drops with incomplete initial responses`
    },
    "GPT-5.1": {
      count: 21,
      content: `**Where It Excels:**
- Clear mathematical steps (HW11)
- LoRA, transformer interpretability, soft prompting
- Formula derivation aligned with official solutions
- Chain of Thoughts for incremental problem-solving (HW5)
- One-shot problem solving

**Limitations:**
- Parsing errors and algebraic mistakes
- Misinterpreted L1 as L2 penalty (HW2)
- LaTeX errors
- Struggles tracking multiple variables through algebra (HW13)
- Circular reasoning in complex sequences
- Degrades with figure interpretation (HW12)

**User Experience:**
- Useful "pocket-TA"
- Correct reasoning and explanations
- Overly verbose and detailed
- Academic integrity guardrails (often bypassed)
- Strong initial responses but inconsistent across longer sequences`
    },
    "GPT-Oss": {
      count: 2,
      content: `**Where It Excels:**
- Non-coding analytical tasks (HW6, HW5)
- One-shotting complex queries
- Symbolic derivations and conceptual reasoning
- 82% accuracy without hallucinations (HW5)

**Limitations:**
- Sensitive to input structure
- Requires clearly formatted LaTeX prompts
- Mis-parsing of ASCII matrices
- Confused BatchNorm vs LayerNorm
- Variable speed (90-180 second responses)

**User Experience:**
- "Surprisingly good for open-source"
- Positive sentiment about capabilities vs expectations
- Speed concerns noted
- Near-zero latency in some cases (HW6)
- Hosting environment impacts performance`
    },
    "GPT-o3": {
      count: 1,
      content: `**Where It Excels:**
- Computation-heavy tasks (HW9 Q1-4)
- Code completion
- Derivations for expectations and variances
- Multi-head attention code
- Problem structure setup
- PyTorch einsums matching official solutions

**Limitations:**
- Incorrect kernel functions (homogeneous quadratic vs degree-2 polynomial)
- Incomplete feature maps
- Missing constant and linear terms
- Susceptible to common traps

**User Experience:**
- Easy-to-follow explanations when correct
- Reasoning aligns with official solutions
- Minimal prompting needed for complex tasks
- Requires validation for specialized areas
- Strong initial reasoning with occasional critical errors`
    },
    "Gemini Flash": {
      count: 11,
      content: `**Where It Excels:**
- Structured mathematical problems
- Clear logic and derivations
- Convolution and normalization (HW5)
- Batch-norm derivatives
- Perfect one-shot performance on Transformer concepts (HW12)
- Self-corrects with clear guidance

**Limitations:**
- Misses critical details (translation equivariance)
- Omits bias terms
- Hallucinations on incorrect assumptions
- Stubbornness on wrong interpretations (HW10)
- Generic summaries for research figures (HW3)
- Overly verbose without correlation to correctness

**User Experience:**
- "Solutions as good as or better than staff solution"
- Useful for mathematical tasks
- Struggles with nuanced conceptual reasoning
- Poor visual interpretation
- Consistently verbose`
    },
    "Gemini Pro": {
      count: 23,
      content: `**Where It Excels:**
- Non-coding theoretical problems
- Detailed mathematical derivations
- Intermediate steps LLMs typically skip (HW1)
- Clean, structured derivations (HW13)
- Conceptual clarity and LaTeX formatting
- Zero hallucination rate on complex tasks (HW12)

**Limitations:**
- Visual interpretation struggles
- Implementation-style questions
- Wrong cost models initially (HW3)
- Requires prompting for tables/graphs (HW6)
- Matrix reading errors (HW5)

**User Experience:**
- Reliable and time-efficient
- Clear interpretations on first try
- Impressive mathematical reasoning presentation
- Better performance feeding sub-questions individually (HW9)
- Prevents error propagation`
    },
    "Gemma 3": {
      count: 2,
      content: `**Where It Excels:**
- Single-variable basic algebra and derivatives (HW1)
- Computational problems (HW9 problems 1-4e)
- Mostly correct on first attempt
- Clearer, more pedagogical explanations than competitors
- Descriptive English in mathematical arguments

**Limitations:**
- Linear algebra concepts (matrix inverses, dimensions)
- Time and space-complexity analysis
- Tensor shape reasoning
- Incorrect bounds despite correct strategy
- PDF parsing failures
- Problem number mapping errors

**User Experience:**
- Enhances understanding even with incorrect answers
- More pedagogical than ChatGPT and Claude
- Frustration with repeated parsing failures
- Valuable educational tool despite inaccuracies`
    },
    "Grok": {
      count: 10,
      content: `**Where It Excels:**
- Mathematical derivations with sufficient context
- Linearized attention with complexity reductions (HW10)
- Reading assignment analysis (FaceNet paper)
- Accurate retrieval and summarization
- One-shot problem solving when properly prompted

**Limitations:**
- Proof problems require guidance
- Verbose responses
- Overwhelming, less direct communication
- Flawed complexity analysis (HW8)
- Confuses total work vs critical path length

**User Experience:**
- Mathematical accuracy appreciated
- High-level summaries effective
- Needs iterative clarification
- "Competent graduate-level tutor" (HW12)
- Preemptive responses lead to off-topic elaborations
- Over-explanation causes confusion`
    },
    "Grok 4.1": {
      count: 2,
      content: `**Where It Excels:**
- Standard lecture material and formulas
- Transformer attention architectures
- Structured step-by-step reasoning
- Implementation-style tasks
- Tensor shape identification
- Key/value caching explanations

**Limitations:**
- Multiple-choice reasoning in bulk
- Hallucinated correct answers (right reasoning, wrong choice)
- Diverts to irrelevant internet references when corrected
- Extended reasoning times
- Inaccurate problem assumptions

**User Experience:**
- Effective "one-shot" for structured problems
- Frustration with multiple-choice hallucinations
- Inefficient irrelevant information searches
- Consistent pattern of unhelpful internet searches when confused`
    },
    "Kimi K2": {
      count: 9,
      content: `**Where It Excels:**
- Non-coding theoretical problems (HW1)
- Gradient descent stability derivations
- Momentum dynamics
- Expectations and variances (HW9)
- GNN message passing interpretation (HW6)
- Zero-shot problem-solving (HW8)
- Self-correction with additional prompts

**Limitations:**
- Misinterprets structural details
- OCR errors affecting accuracy (HW11)
- Over-engineered answers
- Skips steps in qualitative reasoning (HW0)
- Logical leaps without justification (HW7)
- Occasional hallucinations

**User Experience:**
- Clear conceptual explanations
- Reliability issues with unjustified leaps
- Impressed by zero-shot capability
- High one-shot accuracy without "hand-holding"
- Requires careful oversight and verification`
    },
    "LLaMA": {
      count: 1,
      content: `**Where It Excels:**
- Proof-based questions
- Complex theoretical concepts (HW11)
- LoRA adjustments analysis
- Accurate problem statement reproduction
- No hallucination of problem text

**Limitations:**
- Complex calculations
- Multistep formula derivations with numerical insertions
- Fermi estimation
- Omits practical alternatives (initialization methods)

**User Experience:**
- "Did not hallucinate problem question"
- Word-for-word accuracy in reproduction
- Reliable for theoretical explanations
- Correct answers but missing practical details`
    },
    "Mistral": {
      count: 13,
      content: `**Where It Excels:**
- Computational and mathematical questions
- First-attempt correctness (HW8)
- 99% numerical accuracy (HW9)
- Structured derivations (optimization, neural networks)
- Conceptual queries and true/false tasks (HW11)
- Strong linear algebra expertise

**Limitations:**
- Reasoning beyond familiar patterns
- Sticks to initial incorrect explanations (HW2)
- Complex time complexity problems
- Hallucinations with insufficient data (HW12)
- Visual information and diagrams
- No spontaneous uncertainty expression

**User Experience:**
- "Overwhelmingly positive" for math/computation
- Acts as tutor with pedagogical explanations
- Frustration: won't adapt without explicit re-prompting
- Confident in incorrect answers
- Struggles with algorithmic efficiency improvements`
    },
    "Perplexity Sonar": {
      count: 1,
      content: `**Where It Excels:**
- Non-coding homework problems (HW8)
- Convolution kernel derivation
- Impulse response interpretation
- Complexity comparisons
- Self-supervised linear purification
- Ridge-attention math
- Self-diagnosis and error correction

**Limitations:**
- Diagonal-plus-low-rank (DPLR) SSM kernel
- Invented "perturbative terms" in spectral arguments
- Cannot independently verify complex linear-algebraic arguments

**User Experience:**
- "Strong but occasionally overconfident collaborator"
- Improves with specific challenges
- Requires human skepticism
- Better with active supervision
- Strategic prompting increases reliability`
    },
    "Qwen": {
      count: 0,
      content: `**Where It Excels:**
- High-level conceptual explanations
- Symbolic derivations
- Mathematical proofs (diffusion models, DPO gradients - HW13)
- Well-organized, self-contained solutions
- Proper mathematical notation
- Strong context retention (HW7)
- Accurate in theoretical/non-coding tasks

**Limitations:**
- Cannot interpret images
- Graph-related questions fail (HW12)
- Sophisticated math operations (SVD, matrix calculus - HW7, HW4)
- Defaults to brute force vs advanced simplifications
- Skips detailed steps (HW0)
- Small but significant occasional errors

**User Experience:**
- "Qwen's accuracy really impressed me"
- Precise mathematical detail
- Mixed sentiment on reliability
- "Reasonably good at one-shotting... but far from trustworthy"
- Consistent struggle with graphical analysis
- Needs guidance for error correction`
    }
  }
};

