export const BUILD_DATE = 'April 18, 2026';

export const site = {
  title: 'ihelpwithai.com',
  tagline: 'Buyer\'s guide for contractor software and practical AI',
  description:
    'Choose the right AI and software for your contracting business without wasting hours on demos, hype, or bad-fit tools.',
  contactEmail: 'info@ihelpwithai.com',
  socialImage: '/assets/og-default.png',
  analytics: {
    posthogToken: 'phc_REPLACE_ME',
    posthogHost: 'https://us.i.posthog.com'
  },
  navLinks: [
    { href: '/', label: 'Home' },
    { href: '/shortlist/', label: 'Shortlist' },
    { href: '/trades/', label: 'By Trade' },
    { href: '/problems/', label: 'By Problem' },
    { href: '/reviews/', label: 'Reviews' },
    { href: '/compare/', label: 'Compare' },
    { href: '/templates/', label: 'Templates' },
    { href: '/learn/', label: 'Learn' },
    { href: '/starter-pack/', label: 'Starter Pack' }
  ],
  footerGroups: [
    {
      title: 'Start Here',
      links: [
        { href: '/shortlist/', label: 'Start the shortlist' },
        { href: '/trades/', label: 'Browse by trade' },
        { href: '/problems/', label: 'Browse by problem' },
        { href: '/reviews/', label: 'Browse reviews' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/compare/', label: 'Compare tools' },
        { href: '/templates/', label: 'Copyable templates' },
        { href: '/learn/', label: 'Learn what to automate first' },
        { href: '/starter-pack/', label: 'Get the starter pack' }
      ]
    },
    {
      title: 'Trust',
      links: [
        { href: '/about/', label: 'About' },
        { href: '/faq/', label: 'FAQ' },
        { href: '/methodology/', label: 'Methodology' },
        { href: '/affiliate-disclosure/', label: 'Affiliate disclosure' }
      ]
    },
    {
      title: 'Policies',
      links: [
        { href: '/privacy/', label: 'Privacy' },
        { href: '/terms/', label: 'Terms' },
        { href: '/for-vendors/', label: 'For vendors' },
        { href: '/contact/', label: 'Contact' }
      ]
    }
  ],
  homeFaqs: [
    {
      question: 'Who is this site built for?',
      answer:
        'The site is built for contractor owners, office managers, dispatchers, estimators, and GMs who need clearer software decisions around missed calls, quote follow-up, dispatch, reviews, and office admin.'
    },
    {
      question: 'Is this an AI news site or a giant software directory?',
      answer:
        'No. The point is to help a service business narrow to the right next move fast. We use reviews, compare pages, and the shortlist to cut noise, not add more tabs to open.'
    },
    {
      question: 'Do I need a full field-service platform before I try AI add-ons?',
      answer:
        'Not always. If your whole operating system is messy, an all-in-one platform usually comes first. If you already have a stable FSM and one leak hurts most, a focused add-on can be the better move.'
    },
    {
      question: 'How are recommendations made?',
      answer:
        'Recommendations are built around contractor workflows, trade fit, setup reality, and likely payoff for a specific shop profile. Every review is expected to show best fit, bad fit, tradeoffs, and alternatives.'
    }
  ],
  shortlistQuestions: [
    {
      id: 'trade',
      label: 'What trade best matches your shop?',
      options: [
        ['hvac', 'HVAC'],
        ['plumbing', 'Plumbing'],
        ['electrical', 'Electrical'],
        ['roofing', 'Roofing'],
        ['landscaping', 'Landscaping'],
        ['cleaning', 'Cleaning'],
        ['handyman', 'Handyman'],
        ['general-contracting', 'General contracting']
      ]
    },
    {
      id: 'teamSize',
      label: 'How big is the team?',
      options: [
        ['solo', 'Solo or owner only'],
        ['2-5', '2 to 5 people'],
        ['6-15', '6 to 15 people'],
        ['16-40', '16 to 40 people'],
        ['40+', '40 plus']
      ]
    },
    {
      id: 'bottleneck',
      label: 'What hurts most right now?',
      options: [
        ['missed-calls', 'Missed calls and after-hours lead capture'],
        ['quote-follow-up', 'Quote follow-up'],
        ['scheduling-dispatch', 'Scheduling and dispatch'],
        ['reviews-referrals', 'Reviews and referrals'],
        ['office-admin', 'Office admin'],
        ['invoicing-payments', 'Invoicing and payments']
      ]
    },
    {
      id: 'currentStack',
      label: 'What does your current stack look like?',
      options: [
        ['none-spreadsheets', 'Mostly spreadsheets or disconnected tools'],
        ['basic-fsm', 'Basic field-service platform already'],
        ['advanced-fsm', 'Advanced FSM already in place'],
        ['phone-system-only', 'Phone system only'],
        ['crm-heavy', 'CRM-heavy stack']
      ]
    },
    {
      id: 'officeSupport',
      label: 'How much office support do you have?',
      options: [
        ['none', 'No office staff'],
        ['one-person', 'One office person'],
        ['small-team', 'Small office team'],
        ['multi-role', 'Multi-role admin staff']
      ]
    },
    {
      id: 'afterHoursLeadVolume',
      label: 'How painful are after-hours calls?',
      options: [
        ['almost-none', 'Almost none'],
        ['occasional', 'Occasional'],
        ['frequent', 'Frequent'],
        ['major', 'Major pain point']
      ]
    },
    {
      id: 'budget',
      label: 'What is your budget posture?',
      options: [
        ['lean', 'Keep it lean'],
        ['roi', 'Willing to spend for ROI'],
        ['enterprise', 'Need depth more than low price']
      ]
    },
    {
      id: 'setupTolerance',
      label: 'How much setup can your team absorb?',
      options: [
        ['simple', 'I need simple'],
        ['moderate', 'Moderate setup is okay'],
        ['invest', 'We can invest in implementation']
      ]
    }
  ]
};

export const templateSections = [
  {
    id: 'missed-call-texts',
    title: 'Missed call text examples',
    intro:
      'Use these when a lead calls after hours or no one can pick up fast enough. The goal is not to sound robotic. The goal is to buy a little time and keep the conversation alive.',
    tips: [
      'Acknowledge the missed call directly.',
      'Give the next response window clearly.',
      'Offer one simple next step instead of three choices.'
    ],
    blocks: [
      {
        title: 'After-hours first response',
        copy:
          'Hi {{first_name}}, thanks for calling {{company_name}}. We missed you, but we did get your call. If you text back your address and a quick note on the issue, someone from our team will follow up first thing in the morning.'
      },
      {
        title: 'Urgent trade service version',
        copy:
          'Hi {{first_name}}, this is {{company_name}}. We missed your call. If this is urgent, text your address, the problem, and the best callback number. We will route it as quickly as we can.'
      }
    ],
    relatedProblems: ['missed-calls'],
    relatedTrades: ['hvac', 'plumbing', 'electrical']
  },
  {
    id: 'estimate-follow-up-sequences',
    title: 'Estimate follow-up sequences',
    intro:
      'Use these when quotes go out and then disappear into silence. Good follow-up is clear, short, and timed around buyer decision points.',
    tips: [
      'Reference the project and next decision clearly.',
      'Do not send three paragraphs when one sentence will do.',
      'Give the customer an easy way to say yes, no, or not yet.'
    ],
    blocks: [
      {
        title: 'Day one estimate text',
        copy:
          'Hi {{first_name}}, thanks again for meeting with {{company_name}} today. Your estimate is ready. If you want, I can also text a quick summary of the recommended option and next steps.'
      },
      {
        title: 'Three-day follow-up',
        copy:
          'Hi {{first_name}}, checking in on the estimate we sent over for {{project_name}}. Happy to answer questions or walk through options if that helps you make a decision.'
      }
    ],
    relatedProblems: ['quote-follow-up'],
    relatedTrades: ['roofing', 'general-contracting', 'electrical']
  },
  {
    id: 'review-request-texts',
    title: 'Review request texts',
    intro:
      'Use these right after the job when the customer still remembers the result and the crew experience. The best review request feels specific and easy.',
    tips: [
      'Send soon after the job closes.',
      'Keep the ask short and direct.',
      'Do not bury the review link in a paragraph.'
    ],
    blocks: [
      {
        title: 'Simple completed-job request',
        copy:
          'Thanks again for choosing {{company_name}} today. If the visit went well, would you mind leaving a quick review here? {{review_link}} It helps other homeowners know what to expect.'
      },
      {
        title: 'Referral-friendly version',
        copy:
          'We appreciate the opportunity to help with {{project_name}}. If you have a minute, a quick review here would mean a lot to the team: {{review_link}}'
      }
    ],
    relatedProblems: ['reviews-referrals'],
    relatedTrades: ['cleaning', 'landscaping', 'plumbing']
  },
  {
    id: 'on-my-way-texts',
    title: 'On my way text templates',
    intro:
      'Use these to reduce inbound "where is the tech?" calls and make the day feel more organized for customers and office staff.',
    tips: [
      'Name the technician or time window when possible.',
      'Avoid fake precision if the schedule is still moving.',
      'Use the same tone every time so customers recognize it.'
    ],
    blocks: [
      {
        title: 'Basic arrival text',
        copy:
          'Hi {{first_name}}, {{tech_name}} from {{company_name}} is on the way and should arrive in about {{eta_window}}. If anything changes, we will let you know.'
      }
    ],
    relatedProblems: ['scheduling-dispatch'],
    relatedTrades: ['hvac', 'plumbing', 'cleaning']
  },
  {
    id: 'bad-review-response-examples',
    title: 'Bad review response examples',
    intro:
      'Use these when you need to respond without sounding defensive. The public response should show accountability and a path to fix the issue.',
    tips: [
      'Do not argue in public.',
      'Acknowledge the experience, not just your intent.',
      'Move detailed troubleshooting offline fast.'
    ],
    blocks: [
      {
        title: 'Service recovery response',
        copy:
          'Thank you for the feedback. This is not the experience we want associated with our team. We are reviewing what happened and would like the chance to make it right. Please contact {{name}} at {{phone_or_email}} so we can address it directly.'
      }
    ],
    relatedProblems: ['reviews-referrals'],
    relatedTrades: ['roofing', 'electrical', 'general-contracting']
  },
  {
    id: 'seasonal-reminder-campaigns',
    title: 'Seasonal reminder campaigns',
    intro:
      'Use these for tune-ups, recurring services, or seasonal service windows when a reminder can turn existing customers into repeat work.',
    tips: [
      'Tie the reminder to a real seasonal need.',
      'Offer a clear booking path.',
      'Keep the message local and practical.'
    ],
    blocks: [
      {
        title: 'HVAC seasonal reminder',
        copy:
          'Hi {{first_name}}, this is {{company_name}}. As temperatures start to shift, now is a good time to schedule your HVAC tune-up before the busy rush. Want us to send over a few appointment windows?'
      }
    ],
    relatedProblems: ['reviews-referrals'],
    relatedTrades: ['hvac', 'landscaping']
  },
  {
    id: 'job-completion-recap-templates',
    title: 'Job completion recap templates',
    intro:
      'Use these when you want fewer misunderstandings after the work is done and a cleaner handoff into payment, review, or next-visit steps.',
    tips: [
      'Recap what was completed in plain language.',
      'Tell the customer what to watch next.',
      'Make the payment or review step easy.'
    ],
    blocks: [
      {
        title: 'Completion recap',
        copy:
          'Today we completed {{scope_summary}} at {{service_address}}. We also noted {{follow_up_note}}. If you have any questions after today\'s visit, reply here and the office will help.'
      }
    ],
    relatedProblems: ['office-admin'],
    relatedTrades: ['cleaning', 'handyman', 'plumbing']
  },
  {
    id: 'sop-prompts',
    title: 'SOP prompts for office workflows',
    intro:
      'Use these when you want to clean up repeat admin work before adding more software. A better SOP often creates more value than another app.',
    tips: [
      'Start with one messy workflow, not every workflow.',
      'Document who owns each handoff.',
      'Use AI to draft the SOP, then make a human validate it.'
    ],
    blocks: [
      {
        title: 'AI drafting prompt',
        copy:
          'Draft a one-page SOP for our office team handling {{workflow_name}}. Include trigger, owner, required inputs, customer-facing message, handoff steps, and common failure points. Keep it practical for a small contractor business.'
      }
    ],
    relatedProblems: ['office-admin'],
    relatedTrades: ['general-contracting', 'electrical', 'roofing']
  }
];

export const learnSections = [
  {
    id: 'what-ai-should-and-should-not-do',
    title: 'What AI should and should not do in a contractor business',
    summary:
      'AI is strongest when it speeds up admin, follow-up, routing, and message drafting. It is weakest when it pretends to replace trade judgment, jobsite accountability, or customer trust recovery.',
    bullets: [
      'Use AI for first drafts, summaries, reminders, and call handling triage.',
      'Do not let AI make pricing promises or scope promises on its own.',
      'Treat AI like an assistant inside a disciplined process, not a magic fix.'
    ]
  },
  {
    id: 'how-to-pick-your-first-automation',
    title: 'How to pick your first automation',
    summary:
      'Start where a missed message or delayed handoff costs real revenue. The best first automation usually touches inbound calls, estimate follow-up, review requests, or repetitive office communication.',
    bullets: [
      'Pick one leak you can measure in a month.',
      'Choose a workflow with a clear owner.',
      'Avoid stacking three new tools before the first automation proves out.'
    ]
  },
  {
    id: 'what-to-automate-first-without-office-manager',
    title: 'What to automate first if you have no office manager',
    summary:
      'If the owner is answering phones between jobs, start with missed-call coverage, estimate follow-up, and basic job communication. Those three changes usually buy back the most attention fastest.',
    bullets: [
      'Missed-call text back or voice triage first.',
      'Estimate follow-up sequence second.',
      'Arrival and completion texts third.'
    ]
  },
  {
    id: 'do-you-need-an-all-in-one-platform',
    title: 'Do you need an all-in-one platform?',
    summary:
      'You probably do if your quotes, job records, scheduling, invoices, and customer notes still live in separate tools or people\'s heads. If one leak hurts more than the full operating system, a focused add-on may win first.',
    bullets: [
      'Choose all-in-one when the business runs on patchwork.',
      'Choose add-ons when the core system is stable but one bottleneck is expensive.',
      'Do not confuse complexity with maturity.'
    ]
  },
  {
    id: 'how-to-measure-roi-on-missed-call-automation',
    title: 'How to measure ROI on missed-call automation',
    summary:
      'Measure how many inbound calls you miss, what share normally books, and what an average booked job is worth. The ROI conversation gets clearer fast when you multiply the leak by real job value.',
    bullets: [
      'Track missed call count by week.',
      'Estimate how many of those leads would have booked.',
      'Compare that value to the tool cost plus setup time.'
    ]
  }
];

export const reviews = [
  {
    slug: 'jobber',
    toolName: 'Jobber',
    category: 'All in one field-service software',
    summary:
      'A strong all-in-one choice for contractor businesses that want quoting, scheduling, invoicing, payments, and customer follow-up in one operating system without jumping straight to enterprise complexity.',
    oneLineVerdict:
      'A practical first all-in-one for service teams that need cleaner daily operations more than deep enterprise complexity.',
    bestFit:
      'Small to mid-sized service businesses that want one home for quotes, jobs, invoices, and payments.',
    badFit:
      'Larger or highly specialized operations that need heavy customization, dense reporting layers, or deeper enterprise routing.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'landscaping', 'cleaning', 'handyman'],
    teamSizeFit: ['2-5', '6-15', '16-40'],
    setupEffort: 'Moderate',
    pricingPosture: 'A real software budget, but usually easier to justify than enterprise FSMs.',
    bestFor:
      'Shops moving off spreadsheets, texts, and disconnected admin habits.',
    strengths: [
      'Keeps quoting, job records, invoicing, and payments in one place.',
      'Feels approachable for smaller teams that need structure fast.',
      'Gives the office a stronger backbone before layering extra automation.'
    ],
    watchOuts: [
      'Can feel light if dispatch complexity and reporting depth keep growing.',
      'The value drops fast if pricebooks and office habits stay messy.',
      'You may still want add-ons for reviews, lead attribution, or deeper call handling.'
    ],
    workflows: [
      'Estimate to approved job to invoice flow for smaller service teams.',
      'Customer reminder and payment collection flow with less manual chasing.',
      'Base operating system for adding review requests or call-routing tools later.'
    ],
    alternatives: [
      { slug: 'housecall-pro', reason: 'you want broader home-service depth and more growth-stage features' },
      { slug: 'servicetitan', reason: 'the team is much larger and reporting depth matters more than simplicity' }
    ],
    compareLinks: [
      'jobber-vs-housecall-pro',
      'all-in-one-field-service-software-vs-separate-ai-tools'
    ],
    officialUrl: 'https://www.jobber.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'Is Jobber enough on its own for a small shop?',
        answer:
          'Often yes, especially if the bigger problem is scattered admin and weak process consistency. Many teams add review or phone tools later, but Jobber can still solve the core operating-system problem first.'
      },
      {
        question: 'Who usually outgrows Jobber?',
        answer:
          'Shops with heavier routing complexity, deeper reporting demands, or more layers of approvals tend to feel the limits first.'
      }
    ],
    shortlist: {
      budgetLevel: 1,
      setupLevel: 1,
      problems: ['quote-follow-up', 'scheduling-dispatch', 'office-admin', 'invoicing-payments'],
      currentStackFit: ['none-spreadsheets', 'basic-fsm'],
      afterHoursStrength: 0,
      officeStrength: 2
    }
  },
  {
    slug: 'housecall-pro',
    toolName: 'Housecall Pro',
    category: 'All in one field-service software',
    summary:
      'A strong home-service platform for teams that want quoting, scheduling, dispatch, payments, online booking, and customer communication in one contractor-friendly system.',
    oneLineVerdict:
      'One of the stronger all-in-one options for growing home-service shops that want operational depth without going straight to the heaviest platform.',
    bestFit:
      'Growing residential service businesses that want one system for the office, field techs, and customer communication.',
    badFit:
      'Very small shops that only need one focused fix like missed-call coverage or review follow-up.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'cleaning', 'handyman'],
    teamSizeFit: ['2-5', '6-15', '16-40'],
    setupEffort: 'Moderate',
    pricingPosture: 'Mid-range contractor software spend with stronger payoff when the team uses the full workflow.',
    bestFor:
      'Home-service teams that want broader operational depth than lightweight tools usually provide.',
    strengths: [
      'Combines dispatch, invoicing, payments, and customer-facing workflows in one platform.',
      'Fits residential service teams that want a stronger growth platform.',
      'Pairs well with businesses that need more than a basic quoting and invoicing layer.'
    ],
    watchOuts: [
      'You still need clean office process and ownership for follow-up.',
      'Can be too much if the real pain is only one narrow bottleneck.',
      'The team has to commit to using the platform consistently to feel the gain.'
    ],
    workflows: [
      'Scheduling and dispatch coordination across a busier residential service team.',
      'Payment collection and customer communication tied to job flow.',
      'Growth-stage operating system when the business is outgrowing simple admin tools.'
    ],
    alternatives: [
      { slug: 'jobber', reason: 'simplicity and a lighter day-to-day feel matter most' },
      { slug: 'servicetitan', reason: 'the operation is much larger and demands deeper enterprise layers' }
    ],
    compareLinks: [
      'jobber-vs-housecall-pro',
      'all-in-one-field-service-software-vs-separate-ai-tools'
    ],
    officialUrl: 'https://www.housecallpro.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'When does Housecall Pro make more sense than a point solution?',
        answer:
          'When the office is juggling scheduling, payments, customer communication, and quoting in too many disconnected places. That is usually the moment a broader platform earns its keep.'
      },
      {
        question: 'Who should not start here?',
        answer:
          'A very small shop with one painful leak and low setup tolerance may get faster ROI from a focused add-on before buying a larger system.'
      }
    ],
    shortlist: {
      budgetLevel: 1,
      setupLevel: 1,
      problems: ['missed-calls', 'quote-follow-up', 'scheduling-dispatch', 'office-admin', 'invoicing-payments'],
      currentStackFit: ['none-spreadsheets', 'basic-fsm'],
      afterHoursStrength: 1,
      officeStrength: 2
    }
  },
  {
    slug: 'servicetitan',
    toolName: 'ServiceTitan',
    category: 'Enterprise field-service software',
    summary:
      'A heavier-duty operating system for contractor businesses that need deeper dispatch control, reporting, sales workflow visibility, and operational structure across bigger teams.',
    oneLineVerdict:
      'The better fit when operational complexity is the real issue, not when a smaller shop just needs a cleaner first system.',
    bestFit:
      'Larger service operations that need deeper routing, reporting, permissions, and management visibility.',
    badFit:
      'Smaller teams that mostly need faster adoption, simpler admin, and low setup drag.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'roofing'],
    teamSizeFit: ['16-40', '40+'],
    setupEffort: 'High',
    pricingPosture: 'Premium contractor software posture that needs real scale or process discipline to justify.',
    bestFor:
      'Multi-crew or larger service teams that have outgrown lightweight operating systems.',
    strengths: [
      'Stronger fit when reporting depth and process control matter a lot.',
      'Handles bigger operational complexity better than lighter FSM options.',
      'Gives leadership more visibility when the business is already carrying scale.'
    ],
    watchOuts: [
      'Too heavy for many smaller service businesses.',
      'Implementation and change management take real time.',
      'Buying enterprise depth does not fix weak operating discipline by itself.'
    ],
    workflows: [
      'Dispatch-heavy teams with multiple crews and more complex routing pressure.',
      'Sales and job workflows where management reporting matters a lot.',
      'Operations that need stronger control layers across the office and field.'
    ],
    alternatives: [
      { slug: 'housecall-pro', reason: 'you need growth-stage depth but not enterprise weight' },
      { slug: 'jobber', reason: 'the business still values speed and simplicity over scale layers' }
    ],
    compareLinks: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    officialUrl: 'https://www.servicetitan.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'Who should seriously look at ServiceTitan?',
        answer:
          'Teams with enough volume, routing complexity, and reporting demand to justify a heavier implementation and a more structured operating system.'
      },
      {
        question: 'What is the common mistake with ServiceTitan?',
        answer:
          'Buying it too early. If the business is not ready to standardize process and training, the platform can feel expensive and underused.'
      }
    ],
    shortlist: {
      budgetLevel: 2,
      setupLevel: 2,
      problems: ['scheduling-dispatch', 'quote-follow-up', 'office-admin', 'invoicing-payments'],
      currentStackFit: ['basic-fsm', 'advanced-fsm', 'crm-heavy'],
      afterHoursStrength: 0,
      officeStrength: 2
    }
  },
  {
    slug: 'nicejob',
    toolName: 'NiceJob',
    category: 'Review and reputation software',
    summary:
      'A focused reputation tool for contractor businesses that want more review requests going out consistently without turning the office into a follow-up machine.',
    oneLineVerdict:
      'A strong add-on when review volume and local trust matter more than buying another all-in-one platform.',
    bestFit:
      'Service teams with a stable job flow that need better review requests, reputation follow-up, and social proof.',
    badFit:
      'Shops that still do not have a reliable closeout process or enough completed jobs to feed the workflow.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'roofing', 'landscaping', 'cleaning', 'handyman', 'general-contracting'],
    teamSizeFit: ['solo', '2-5', '6-15', '16-40'],
    setupEffort: 'Low to moderate',
    pricingPosture: 'Usually easier to justify than a bigger platform if reviews are the main leak.',
    bestFor:
      'Teams that finish good work but do not ask for reviews consistently enough.',
    strengths: [
      'Puts review follow-up on a repeatable rhythm.',
      'Works well when the service experience is already solid and the problem is consistency.',
      'Can create a visible reputation lift without rebuilding the full stack.'
    ],
    watchOuts: [
      'Does not fix poor service or weak closeout habits by itself.',
      'Review volume still depends on job completion discipline and timing.',
      'Best as an add-on, not as a replacement for your operating system.'
    ],
    workflows: [
      'Automatic review requests after completed service calls.',
      'Reputation follow-up for teams that want more proof in local markets.',
      'Referral-friendly closeout flow for repeat-service businesses.'
    ],
    alternatives: [
      { slug: 'callrail', reason: 'the bigger problem is lead intake and attribution, not review volume' },
      { slug: 'jobber', reason: 'the whole operating system is disorganized, not just review requests' }
    ],
    compareLinks: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    officialUrl: 'https://www.nicejob.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'When does NiceJob make the most sense?',
        answer:
          'When the team already delivers solid work but review requests go out inconsistently and local proof is lagging behind job quality.'
      },
      {
        question: 'What should happen before you buy it?',
        answer:
          'Make sure the team knows when the service is considered complete and who owns the customer handoff. That is what gives review automation something useful to trigger from.'
      }
    ],
    shortlist: {
      budgetLevel: 0,
      setupLevel: 0,
      problems: ['reviews-referrals'],
      currentStackFit: ['none-spreadsheets', 'basic-fsm', 'advanced-fsm', 'crm-heavy'],
      afterHoursStrength: 0,
      officeStrength: 1
    }
  },
  {
    slug: 'callrail',
    toolName: 'CallRail',
    category: 'Call tracking and lead-intake visibility',
    summary:
      'A strong fit when call-heavy contractor businesses need better visibility into lead sources, cleaner intake tracking, and more discipline around how inbound calls are handled.',
    oneLineVerdict:
      'Best when the business wins or loses on inbound calls and wants better lead visibility before buying a bigger platform.',
    bestFit:
      'Call-driven contractor businesses that want stronger attribution, call handling visibility, and better lead response discipline.',
    badFit:
      'Teams that need a full operating system for dispatch, invoicing, and job management more than call insight.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'roofing', 'landscaping', 'cleaning'],
    teamSizeFit: ['2-5', '6-15', '16-40', '40+'],
    setupEffort: 'Moderate',
    pricingPosture: 'Usually easier to justify when inbound calls drive real revenue and marketing spend.',
    bestFor:
      'Businesses where phone calls still drive a lot of new work and the team wants tighter lead handling.',
    strengths: [
      'Clarifies where calls are coming from and how the team handles them.',
      'Supports call-heavy businesses that want better intake visibility before a full stack overhaul.',
      'Can sit alongside an existing FSM when call handling is the expensive leak.'
    ],
    watchOuts: [
      'Does not replace dispatch, quoting, invoicing, or broad office process.',
      'The team still needs a clean answer process and ownership model.',
      'If you mostly need shared texting and a simpler phone workflow, you may prefer a lighter phone-first tool.'
    ],
    workflows: [
      'Lead-source visibility for marketing-driven call volume.',
      'Call handling reviews for offices that want fewer dropped or mishandled opportunities.',
      'Missed-call workflow analysis before adding more automation.'
    ],
    alternatives: [
      { slug: 'openphone', reason: 'a simpler shared business phone workflow matters more than attribution depth' },
      { slug: 'housecall-pro', reason: 'the business really needs a full contractor operating system instead of a lead-intake layer' }
    ],
    compareLinks: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    officialUrl: 'https://www.callrail.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'Is CallRail a full contractor operating system?',
        answer:
          'No. It is stronger as a lead-intake and call-visibility layer. If your bigger problem is scheduling, quoting, and invoicing, you still need to compare operating systems.'
      },
      {
        question: 'Who gets the most value from CallRail?',
        answer:
          'Teams with meaningful inbound call volume, marketing spend, and a real need to see where calls come from and how well the office handles them.'
      }
    ],
    shortlist: {
      budgetLevel: 1,
      setupLevel: 1,
      problems: ['missed-calls', 'reviews-referrals'],
      currentStackFit: ['phone-system-only', 'basic-fsm', 'advanced-fsm', 'crm-heavy'],
      afterHoursStrength: 3,
      officeStrength: 1
    }
  },
  {
    slug: 'openphone',
    toolName: 'OpenPhone',
    category: 'Shared business phone system',
    summary:
      'A lighter shared phone option for contractor teams that want better call ownership, shared inboxes, texting, and team visibility without adopting a full operating system.',
    oneLineVerdict:
      'A good first step when phone communication is messy but the business is not ready for a larger contractor software rollout.',
    bestFit:
      'Smaller service teams that need cleaner shared calling and texting before a bigger systems project.',
    badFit:
      'Operations looking for deep dispatch, quoting, and job workflow in the same tool.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'cleaning', 'handyman'],
    teamSizeFit: ['solo', '2-5', '6-15'],
    setupEffort: 'Low',
    pricingPosture: 'Usually lighter than a bigger contractor stack.',
    bestFor:
      'Teams that mostly need phone clarity, shared inbox ownership, and faster follow-up.',
    strengths: [
      'Simple shared-call and text workflow for smaller teams.',
      'Helps stop communication from living inside one person\'s cell phone.',
      'Lower setup drag than a full operating system.'
    ],
    watchOuts: [
      'Does not solve dispatch, quoting, invoicing, or deep operations.',
      'Can become one more tool if the rest of the process is already fragmented.',
      'Not the right first move if the whole business runs on disconnected admin.'
    ],
    workflows: [
      'Shared business number with better handoff across office staff.',
      'Basic lead response flow when missed follow-up is the issue.',
      'Cleaner texting and call ownership for smaller service teams.'
    ],
    alternatives: [
      { slug: 'callrail', reason: 'attribution and inbound call visibility matter more than simple team phone workflow' },
      { slug: 'jobber', reason: 'the business needs a bigger operating system instead of just cleaner phone handling' }
    ],
    compareLinks: [],
    officialUrl: 'https://www.openphone.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'When should a contractor pick OpenPhone first?',
        answer:
          'When the main pain is shared call ownership, texting, and follow-up clarity, not deeper quoting or dispatch workflows.'
      }
    ],
    shortlist: {
      budgetLevel: 0,
      setupLevel: 0,
      problems: ['missed-calls', 'office-admin'],
      currentStackFit: ['phone-system-only', 'none-spreadsheets', 'basic-fsm'],
      afterHoursStrength: 2,
      officeStrength: 1
    }
  },
  {
    slug: 'zapier',
    toolName: 'Zapier',
    category: 'Workflow automation layer',
    summary:
      'Useful when a contractor business already has core tools but keeps losing time on repetitive handoffs, notifications, and admin glue work between systems.',
    oneLineVerdict:
      'Best as workflow glue after the team knows what process it actually wants to repeat.',
    bestFit:
      'Teams with at least a few stable tools already in place and one repeatable workflow worth automating.',
    badFit:
      'Businesses that still need a cleaner operating system before adding more moving parts.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'roofing', 'landscaping', 'cleaning', 'handyman', 'general-contracting'],
    teamSizeFit: ['2-5', '6-15', '16-40'],
    setupEffort: 'Moderate',
    pricingPosture: 'Can be efficient when it replaces real admin repetition, but only after the process is clear.',
    bestFor:
      'Shops that want workflow glue between lead forms, CRM steps, job updates, and notifications.',
    strengths: [
      'Connects tools that otherwise do not hand work off cleanly.',
      'Good for repetitive alerts, handoffs, and admin triggers.',
      'Flexible once the process is stable.'
    ],
    watchOuts: [
      'Automates chaos if the underlying process is still weak.',
      'Setup can sprawl if nobody owns the logic.',
      'Not a substitute for choosing the right core software stack.'
    ],
    workflows: [
      'Lead-form handoff into follow-up notifications.',
      'Review request or completion-trigger workflows across tools.',
      'Office notifications when specific sales or service events happen.'
    ],
    alternatives: [
      { slug: 'chatgpt', reason: 'the bigger pain is writing and admin support rather than system-to-system automation' },
      { slug: 'jobber', reason: 'you still need the base operating system first' }
    ],
    compareLinks: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    officialUrl: 'https://zapier.com/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'When does Zapier pay off for a contractor business?',
        answer:
          'After the team can point to one repeat workflow with a clear owner and a real time cost. If the process is still fuzzy, the automation usually creates more confusion than value.'
      }
    ],
    shortlist: {
      budgetLevel: 0,
      setupLevel: 1,
      problems: ['office-admin', 'reviews-referrals', 'quote-follow-up'],
      currentStackFit: ['basic-fsm', 'advanced-fsm', 'crm-heavy'],
      afterHoursStrength: 0,
      officeStrength: 3
    }
  },
  {
    slug: 'chatgpt',
    toolName: 'ChatGPT',
    category: 'General AI assistant for office work',
    summary:
      'Useful when the office needs faster drafting, clearer responses, SOP support, and less writing drag, but not when the business needs a true operating system.',
    oneLineVerdict:
      'Strong for office writing and process support, weak as a replacement for contractor software.',
    bestFit:
      'Owners and office staff who need faster writing, summaries, customer responses, and SOP drafting.',
    badFit:
      'Teams hoping a chatbot will replace dispatch, quoting, invoicing, or operating discipline.',
    tradeFit: ['hvac', 'plumbing', 'electrical', 'roofing', 'landscaping', 'cleaning', 'handyman', 'general-contracting'],
    teamSizeFit: ['solo', '2-5', '6-15', '16-40'],
    setupEffort: 'Low',
    pricingPosture: 'Usually a light spend compared with contractor platforms, but only valuable with clear usage rules.',
    bestFor:
      'Writing, SOP drafting, customer message cleanup, and turning rough notes into usable office output.',
    strengths: [
      'Fast for drafting messages, summaries, and SOPs.',
      'Useful when no office manager means the owner still writes everything.',
      'Can support training and process documentation with low friction.'
    ],
    watchOuts: [
      'Not a field-service platform.',
      'Needs clear human review for promises, pricing, and customer commitments.',
      'Can produce confident nonsense if you ask it to guess instead of structure a known process.'
    ],
    workflows: [
      'Drafting estimate follow-up messages and office scripts.',
      'Turning rough admin notes into SOP drafts.',
      'Creating cleaner customer-facing responses for the office team.'
    ],
    alternatives: [
      { slug: 'zapier', reason: 'the pain is system handoffs rather than writing' },
      { slug: 'jobber', reason: 'the business needs a real operating system instead of a drafting assistant' }
    ],
    compareLinks: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    officialUrl: 'https://openai.com/chatgpt/',
    lastReviewed: BUILD_DATE,
    faqs: [
      {
        question: 'What should ChatGPT own in a contractor business?',
        answer:
          'Drafts, summaries, and internal process support are fair game. Pricing promises, scope decisions, and customer commitments still need a human owner.'
      }
    ],
    shortlist: {
      budgetLevel: 0,
      setupLevel: 0,
      problems: ['office-admin', 'quote-follow-up', 'training-sops'],
      currentStackFit: ['none-spreadsheets', 'basic-fsm', 'advanced-fsm', 'crm-heavy'],
      afterHoursStrength: 0,
      officeStrength: 3
    }
  }
];

export const comparisons = [
  {
    slug: 'jobber-vs-housecall-pro',
    title: 'Jobber vs Housecall Pro for contractor businesses',
    shortTitle: 'Jobber vs Housecall Pro',
    scenario:
      'Two strong all-in-one options for service teams that want to tighten quoting, scheduling, payments, and follow-up without building a messy multi-tool stack.',
    summary:
      'Choose Jobber when simplicity and faster adoption matter most. Choose Housecall Pro when you want broader home-service depth and are willing to carry a little more platform weight.',
    leftTool: 'jobber',
    rightTool: 'housecall-pro',
    rows: [
      ['Best for', 'Smaller teams that want a cleaner all-in-one quickly', 'Growing home-service shops that want broader workflow depth'],
      ['Setup weight', 'Lighter', 'Moderate'],
      ['Where it wins', 'Ease of adoption and simpler day-to-day flow', 'Broader residential service depth and customer workflow coverage'],
      ['Watch-out', 'Can feel light as complexity grows', 'Needs stronger process discipline to feel the full gain'],
      ['Team profile', 'Owner-led to growth-stage service teams', 'Growth-stage home-service shops with more moving parts']
    ],
    chooseLeft: [
      'You want the simpler all-in-one that still covers quotes, jobs, invoices, and payments.',
      'The office needs cleaner process now, not a heavier implementation project.',
      'The team is growing, but not yet craving enterprise depth.'
    ],
    chooseRight: [
      'You want broader contractor workflow depth inside one platform.',
      'The business already feels the limits of lighter operating systems.',
      'You are willing to put a little more process discipline behind the rollout.'
    ],
    doNeither: [
      'Do neither if the business only needs one narrow fix like missed-call coverage or review follow-up.',
      'Do neither if no one owns implementation and the office will not change behavior.'
    ],
    startHere: [
      'If the whole operating system feels messy, start with this comparison.',
      'If one leak hurts more than everything else, go back to the problem pages first.'
    ],
    teamRecommendations: [
      'Solo to 5 people: Jobber usually feels easier to adopt.',
      '6 to 15 people: Either can fit. The better choice depends on how much platform depth the office can actually use.',
      'Larger teams: Housecall Pro often holds the middle ground better before you jump to an enterprise option.'
    ],
    commonMistakes: [
      'Buying the platform with the longer feature list when the team really needs the one they will use consistently.',
      'Ignoring how disciplined the office is about follow-up, data hygiene, and ownership.'
    ],
    faqs: [
      {
        question: 'Which one is better for a small service team?',
        answer:
          'Jobber often wins when simplicity and faster adoption matter most. Housecall Pro starts to look stronger when the business wants broader workflow depth and can support a slightly heavier rollout.'
      }
    ],
    lastReviewed: BUILD_DATE
  },
  {
    slug: 'all-in-one-field-service-software-vs-separate-ai-tools',
    title: 'All-in-one field-service software vs separate AI tools',
    shortTitle: 'All-in-one vs separate AI tools',
    scenario:
      'This decision matters when a contractor business is trying to fix messy operations without accidentally creating an even messier stack.',
    summary:
      'Choose all-in-one software when the operating system itself is fragmented. Choose separate AI tools when the base system is stable and one specific leak deserves a focused fix.',
    leftTool: 'jobber',
    rightTool: 'chatgpt',
    leftLabel: 'All-in-one field-service software',
    rightLabel: 'Separate AI or point tools',
    rows: [
      ['Best for', 'Shops with messy quotes, jobs, invoices, and customer records', 'Teams with a stable base stack and one expensive leak'],
      ['Simplicity', 'Higher once adopted', 'Lower if too many tools pile up'],
      ['Flexibility', 'Lower, but more controlled', 'Higher, but easier to sprawl'],
      ['Implementation burden', 'Heavier upfront', 'Can feel lighter but spreads across more tools'],
      ['Typical examples', 'Jobber, Housecall Pro, ServiceTitan', 'CallRail, OpenPhone, Zapier, ChatGPT']
    ],
    chooseLeft: [
      'Your business still runs on disconnected admin habits.',
      'The office needs one operating system more than another add-on.',
      'You want cleaner quoting, scheduling, invoicing, and records in the same place.'
    ],
    chooseRight: [
      'Your base stack is already stable enough.',
      'One leak, such as missed calls or office writing, is costing more than the rest.',
      'You have someone who can actually own the extra tool and its handoffs.'
    ],
    doNeither: [
      'Do neither if the real problem is still unclear and the team cannot name the one workflow to improve first.',
      'Do neither if everyone expects software to fix weak ownership and inconsistent process.'
    ],
    startHere: [
      'If quotes, jobs, invoices, and customer history are all messy, start with all-in-one.',
      'If operations are mostly stable but one bottleneck hurts, start with a point solution.'
    ],
    teamRecommendations: [
      'Solo to 5 people: bias toward simplicity unless one leak is obviously measurable.',
      '6 to 15 people: either route can work, but document ownership first.',
      '16 plus: stack decisions need more discipline around permissions, reporting, and handoffs.'
    ],
    commonMistakes: [
      'Adding Zapier or ChatGPT before the office even knows the standard workflow.',
      'Buying an enterprise platform when the team really needed one smaller fix and cleaner habits.'
    ],
    faqs: [
      {
        question: 'What is the most common wrong move here?',
        answer:
          'Adding several AI tools on top of a weak operating system. That usually creates more places for work to get dropped instead of fewer.'
      }
    ],
    lastReviewed: BUILD_DATE
  }
];

export const trades = [
  {
    slug: 'hvac',
    title: 'HVAC',
    description:
      'HVAC teams usually feel pressure from missed calls, maintenance reminders, dispatch windows, and high-value estimates that need timely follow-up.',
    bottlenecks: [
      'Missed calls and after-hours lead capture during peak weather swings.',
      'Scheduling and dispatch pressure when emergency work collides with maintenance routes.',
      'Estimate follow-up on replacement jobs and larger system decisions.'
    ],
    stackStages: [
      {
        title: 'If the office is still patching everything together',
        body: 'Start by comparing an all-in-one contractor platform so quotes, jobs, invoices, and customer records stop living in separate places.'
      },
      {
        title: 'If the FSM already works but the phone is the leak',
        body: 'Layer in a call-handling or phone workflow tool before you buy more software than the team can absorb.'
      },
      {
        title: 'If repeat service is healthy but reputation is weak',
        body: 'Use review automation and seasonal reminder templates to turn completed visits into more trust and more repeat work.'
      }
    ],
    categories: [
      'All-in-one field-service software',
      'Lead-intake and call handling',
      'Review and repeat-service follow-up'
    ],
    featuredReviews: ['jobber', 'housecall-pro', 'callrail'],
    featuredComparisons: ['jobber-vs-housecall-pro', 'all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['missed-call-texts', 'seasonal-reminder-campaigns', 'estimate-follow-up-sequences'],
    featuredProblems: ['missed-calls', 'scheduling-dispatch', 'quote-follow-up'],
    faqs: [
      {
        question: 'What should an HVAC business automate first?',
        answer:
          'Usually missed-call coverage, maintenance reminder flow, or estimate follow-up. Those are common revenue leaks that can be improved without overhauling everything at once.'
      }
    ]
  },
  {
    slug: 'plumbing',
    title: 'Plumbing',
    description:
      'Plumbing shops often win or lose on speed to lead, urgent dispatch coordination, and whether the office can turn service activity into repeat work and review volume.',
    bottlenecks: [
      'Inbound calls that need quick triage and scheduling.',
      'Route coordination when jobs change fast through the day.',
      'Review and referral follow-up after short service visits.'
    ],
    stackStages: [
      {
        title: 'Need one cleaner system',
        body: 'Compare all-in-one tools first when the office is still chasing quotes, invoices, and customer notes across too many places.'
      },
      {
        title: 'Need cleaner lead handling',
        body: 'Look at call and phone workflow tools when missed calls or weak handoff discipline are costing booked work.'
      },
      {
        title: 'Need stronger local proof',
        body: 'Add review automation once closeout timing and customer communication are consistent.'
      }
    ],
    categories: [
      'All-in-one field-service software',
      'Phone and call-routing tools',
      'Review automation'
    ],
    featuredReviews: ['housecall-pro', 'callrail', 'nicejob'],
    featuredComparisons: ['jobber-vs-housecall-pro', 'all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['missed-call-texts', 'review-request-texts', 'on-my-way-texts'],
    featuredProblems: ['missed-calls', 'scheduling-dispatch', 'reviews-referrals'],
    faqs: [
      {
        question: 'Why do plumbing shops often need phone improvements first?',
        answer:
          'Because urgent work often starts with a call. If the office response is weak, the software recommendation should usually start there.'
      }
    ]
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    description:
      'Electrical businesses often need cleaner estimate follow-up, clearer project communication, and better office structure around scheduling and paperwork.',
    bottlenecks: [
      'Quote follow-up on jobs that require more trust and explanation.',
      'Scheduling and crew coordination across service work and project work.',
      'Office admin, documentation, and customer communication.'
    ],
    stackStages: [
      {
        title: 'If quoting and admin are both sloppy',
        body: 'Start with a stronger operating system before you try to automate communication around a weak process.'
      },
      {
        title: 'If communication is the bigger leak',
        body: 'Use an assistant or workflow layer for follow-up scripts, internal SOPs, and office message cleanup.'
      },
      {
        title: 'If the business already has stable operations',
        body: 'Use add-ons to tighten one workflow at a time instead of rebuilding the whole stack.'
      }
    ],
    categories: [
      'Field-service software',
      'Office writing and SOP tools',
      'Estimate follow-up workflows'
    ],
    featuredReviews: ['jobber', 'chatgpt', 'servicetitan'],
    featuredComparisons: ['jobber-vs-housecall-pro', 'all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['estimate-follow-up-sequences', 'sop-prompts', 'job-completion-recap-templates'],
    featuredProblems: ['quote-follow-up', 'scheduling-dispatch', 'office-admin'],
    faqs: [
      {
        question: 'What usually matters more for electricians: AI or process discipline?',
        answer:
          'Process discipline first. AI becomes useful after the office knows how estimates, approvals, and customer communication should actually flow.'
      }
    ]
  },
  {
    slug: 'roofing',
    title: 'Roofing',
    description:
      'Roofing companies usually feel the pressure in lead handling, estimate follow-up, job communication, and keeping office admin under control during storm or season spikes.',
    bottlenecks: [
      'Estimate follow-up on larger-ticket jobs with longer decision windows.',
      'Review and reputation follow-up after completed projects.',
      'Office admin and handoffs between sales, production, and customer communication.'
    ],
    stackStages: [
      {
        title: 'If leads are strong but close rate is weak',
        body: 'Focus on quote follow-up before adding more lead sources.'
      },
      {
        title: 'If handoffs are the problem',
        body: 'Use a stronger operating system or workflow automation so information stops dying between people.'
      },
      {
        title: 'If reputation is lagging after good jobs',
        body: 'Add review and recap workflows once the closeout process is consistent.'
      }
    ],
    categories: [
      'Estimate follow-up systems',
      'Field-service or CRM operating systems',
      'Review and reputation tools'
    ],
    featuredReviews: ['servicetitan', 'nicejob', 'chatgpt'],
    featuredComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['estimate-follow-up-sequences', 'review-request-texts', 'job-completion-recap-templates'],
    featuredProblems: ['quote-follow-up', 'reviews-referrals', 'office-admin'],
    faqs: [
      {
        question: 'Why is quote follow-up so important in roofing?',
        answer:
          'Because the job value is larger, the cycle is longer, and buyers often need more trust and more reminders before they commit.'
      }
    ]
  },
  {
    slug: 'landscaping',
    title: 'Landscaping',
    description:
      'Landscaping businesses often care about route coordination, repeat service communication, local reputation, and seasonal reminder workflows that keep crews full.',
    bottlenecks: [
      'Reviews and referrals for local trust.',
      'Office admin around scheduling changes and repeat service communication.',
      'Seasonal marketing and reminder work that slips when the team gets busy.'
    ],
    stackStages: [
      {
        title: 'If route coordination is already stable',
        body: 'Add review and seasonal reminder systems before rebuilding the whole stack.'
      },
      {
        title: 'If scheduling is still messy',
        body: 'Start with a cleaner service platform so jobs, routes, and payments stop drifting.'
      },
      {
        title: 'If admin is eating margin',
        body: 'Use AI drafting and simple automations for recurring messages and internal SOPs.'
      }
    ],
    categories: [
      'Review and referral tools',
      'Seasonal reminder workflows',
      'Contractor operating systems'
    ],
    featuredReviews: ['nicejob', 'jobber', 'zapier'],
    featuredComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['review-request-texts', 'seasonal-reminder-campaigns', 'job-completion-recap-templates'],
    featuredProblems: ['reviews-referrals', 'office-admin'],
    faqs: [
      {
        question: 'What is the fastest win for many landscaping companies?',
        answer:
          'Usually a better review request rhythm or seasonal reminder flow, because repeat work and local proof drive real revenue without a massive systems project.'
      }
    ]
  },
  {
    slug: 'cleaning',
    title: 'Cleaning',
    description:
      'Cleaning businesses often live on speed to lead, schedule communication, local trust, and repeat-service admin that has to stay tight at high volume.',
    bottlenecks: [
      'Scheduling and dispatch clarity.',
      'Review generation after completed recurring work.',
      'Office admin and customer messaging.'
    ],
    stackStages: [
      {
        title: 'If schedule and communication are shaky',
        body: 'Start with a cleaner operating system or phone workflow before layering more automations.'
      },
      {
        title: 'If service quality is good but trust is lagging',
        body: 'Prioritize review automation and closeout templates.'
      },
      {
        title: 'If admin load keeps rising',
        body: 'Use AI support for repeat messages, recap templates, and SOP cleanup.'
      }
    ],
    categories: [
      'Scheduling and dispatch software',
      'Review automation',
      'Office messaging support'
    ],
    featuredReviews: ['housecall-pro', 'nicejob', 'openphone'],
    featuredComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['review-request-texts', 'on-my-way-texts', 'job-completion-recap-templates'],
    featuredProblems: ['scheduling-dispatch', 'reviews-referrals', 'office-admin'],
    faqs: [
      {
        question: 'Why do cleaning companies need strong communication systems?',
        answer:
          'Because customer expectations are shaped by reliability and repeat communication. Weak reminders and weak follow-up can undo good service fast.'
      }
    ]
  },
  {
    slug: 'handyman',
    title: 'Handyman',
    description:
      'Handyman businesses often need the smallest stack that still helps them stop missing calls, tighten follow-up, and reduce owner-admin overload.',
    bottlenecks: [
      'Missed calls when the owner is on the job.',
      'Quote follow-up on smaller jobs that still need quick decisions.',
      'Office admin and customer communication that happens between site visits.'
    ],
    stackStages: [
      {
        title: 'If the owner is still the whole office',
        body: 'Bias toward simpler tools and templates first. Complexity is rarely the right answer here.'
      },
      {
        title: 'If phone follow-up is the leak',
        body: 'Use a phone workflow tool or missed-call response before chasing a larger rollout.'
      },
      {
        title: 'If admin work keeps spilling into nights',
        body: 'Add a drafting assistant or light automation layer only after the workflow is clear.'
      }
    ],
    categories: [
      'Phone workflow tools',
      'Simple all-in-one software',
      'Office writing support'
    ],
    featuredReviews: ['openphone', 'jobber', 'chatgpt'],
    featuredComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['missed-call-texts', 'estimate-follow-up-sequences', 'job-completion-recap-templates'],
    featuredProblems: ['missed-calls', 'quote-follow-up', 'office-admin'],
    faqs: [
      {
        question: 'What is the most common stack mistake for handyman businesses?',
        answer:
          'Buying too much software too early. Most owner-led shops need a clean first fix and disciplined messaging more than they need an elaborate stack.'
      }
    ]
  },
  {
    slug: 'general-contracting',
    title: 'General contracting',
    description:
      'General contractors often care more about estimate follow-up, customer communication, documentation, and cleaner office process than about lightweight service-call speed.',
    bottlenecks: [
      'Quote follow-up on larger or longer-cycle projects.',
      'Office admin and documentation handoffs.',
      'Training and SOP consistency across project communication.'
    ],
    stackStages: [
      {
        title: 'If every project still depends on memory',
        body: 'Start with better process structure before chasing automation.'
      },
      {
        title: 'If the office is slow and overloaded',
        body: 'Use drafting support and workflow cleanup to create repeatable internal standards.'
      },
      {
        title: 'If customer handoff is the friction point',
        body: 'Use recap and follow-up templates so the team stops reinventing communication every time.'
      }
    ],
    categories: [
      'Estimate follow-up workflows',
      'Office process and SOP support',
      'Customer recap templates'
    ],
    featuredReviews: ['chatgpt', 'zapier', 'nicejob'],
    featuredComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    featuredTemplates: ['estimate-follow-up-sequences', 'sop-prompts', 'job-completion-recap-templates'],
    featuredProblems: ['quote-follow-up', 'office-admin'],
    faqs: [
      {
        question: 'Should a GC start with AI or process cleanup?',
        answer:
          'Process cleanup first. AI becomes useful when there is already a repeatable way the office wants proposals, updates, and internal handoffs to work.'
      }
    ]
  }
];

export const problems = [
  {
    slug: 'missed-calls',
    title: 'Missed calls and after-hours lead capture',
    description:
      'When a contractor business misses inbound calls, it often loses work before the estimating or scheduling conversation even starts.',
    whyItMatters:
      'Speed to lead still matters. If nobody responds until the next day, another shop often wins the work first. This problem is especially expensive for trades where urgency drives the initial call.',
    symptoms: [
      'The owner or techs are still the fallback phone answerers.',
      'Voicemails pile up before anyone calls back.',
      'There is no consistent text-back or after-hours process.',
      'The office cannot tell which call sources actually produce jobs.'
    ],
    solutionCategories: [
      {
        title: 'Shared phone workflows',
        body: 'Useful when the team mostly needs call ownership, shared texting, and fewer dropped follow-ups.'
      },
      {
        title: 'Lead tracking and call visibility',
        body: 'Useful when call-driven marketing needs stronger attribution and intake visibility.'
      },
      {
        title: 'Full contractor operating systems',
        body: 'Useful when call handling is only one symptom of a bigger operating-system problem.'
      }
    ],
    recommendedReviews: ['callrail', 'openphone', 'housecall-pro'],
    recommendedComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    recommendedTemplates: ['missed-call-texts', 'on-my-way-texts'],
    roiFactors: [
      'How many inbound calls you miss each week.',
      'What share of those calls usually books.',
      'Average value of a booked job or inspection.',
      'How often calls come after hours or while crews are onsite.'
    ],
    faqs: [
      {
        question: 'Should a business fix missed calls before buying a bigger platform?',
        answer:
          'Often yes, especially if calls drive most new work. But if every other workflow is also broken, the bigger operating-system decision may still come first.'
      }
    ]
  },
  {
    slug: 'quote-follow-up',
    title: 'Quote follow-up without more office chaos',
    description:
      'A lot of contractor revenue leaks out after the estimate, not before it. A weak follow-up rhythm quietly kills close rate.',
    whyItMatters:
      'Customers are usually comparing options, getting distracted, or waiting for someone to guide the decision. Good follow-up makes the process feel easier without sounding needy.',
    symptoms: [
      'The office sends the estimate but does not have a follow-up rhythm.',
      'Different team members send completely different messages.',
      'Bigger jobs sit with no next step until someone remembers to chase them.',
      'Close rate feels weaker than the number of estimates going out.'
    ],
    solutionCategories: [
      {
        title: 'All-in-one systems with quote workflow',
        body: 'Best when estimating, approval, invoicing, and customer history all need a stronger home.'
      },
      {
        title: 'AI drafting support',
        body: 'Best when the team already has the process, but message quality and consistency are weak.'
      },
      {
        title: 'Workflow automation',
        body: 'Best when the office wants repeat reminders, internal alerts, or standardized handoffs between tools.'
      }
    ],
    recommendedReviews: ['jobber', 'housecall-pro', 'chatgpt'],
    recommendedComparisons: ['jobber-vs-housecall-pro', 'all-in-one-field-service-software-vs-separate-ai-tools'],
    recommendedTemplates: ['estimate-follow-up-sequences', 'job-completion-recap-templates'],
    roiFactors: [
      'Estimate count per month.',
      'Average gross value per approved job.',
      'Current close rate versus possible close rate with better follow-up.',
      'How much owner or office time currently goes into manual chasing.'
    ],
    faqs: [
      {
        question: 'What is the first fix when quote follow-up is weak?',
        answer:
          'Decide on the timing and owner first. Software matters, but a clear follow-up rhythm and accountability matter more than a fancy sequence builder.'
      }
    ]
  },
  {
    slug: 'scheduling-dispatch',
    title: 'Scheduling and dispatch without daily scramble',
    description:
      'Scheduling pain is rarely just a calendar problem. It is usually a handoff problem between the office, the field, and the customer.',
    whyItMatters:
      'Late arrival communication, poor routing, and weak ownership create internal chaos and a worse customer experience at the same time.',
    symptoms: [
      'Customers keep calling to ask where the tech is.',
      'The office manually updates the same information in multiple places.',
      'Dispatch changes are happening through text threads and memory.',
      'Route changes create communication failures all day long.'
    ],
    solutionCategories: [
      {
        title: 'Field-service operating systems',
        body: 'Best when scheduling, job status, payments, and records all need one source of truth.'
      },
      {
        title: 'Phone and messaging layers',
        body: 'Best when the office mainly needs better handoff and shared visibility around customer communication.'
      },
      {
        title: 'Light automation',
        body: 'Best when the base process already works and you want fewer manual updates.'
      }
    ],
    recommendedReviews: ['housecall-pro', 'jobber', 'servicetitan'],
    recommendedComparisons: ['jobber-vs-housecall-pro', 'all-in-one-field-service-software-vs-separate-ai-tools'],
    recommendedTemplates: ['on-my-way-texts', 'job-completion-recap-templates'],
    roiFactors: [
      'How many schedule-change calls hit the office every day.',
      'How often crews arrive late without a customer update.',
      'How much admin time is burned on re-entering schedule details.',
      'Whether missed communication turns into cancellations or complaints.'
    ],
    faqs: [
      {
        question: 'When is dispatch pain really a larger operating-system problem?',
        answer:
          'When scheduling, notes, job status, and customer communication all live in separate places and nobody trusts one source of truth.'
      }
    ]
  },
  {
    slug: 'reviews-referrals',
    title: 'More reviews and referrals from completed jobs',
    description:
      'Good work does not automatically become visible proof. Review volume usually rises when the closeout process is timely, specific, and consistent.',
    whyItMatters:
      'Local trust matters long before a prospect speaks to your office. Stronger review flow improves conversion, referral confidence, and the perceived consistency of the business.',
    symptoms: [
      'Customers say nice things in person but never leave reviews.',
      'The team asks inconsistently and usually too late.',
      'No one owns the post-job follow-up step.',
      'The business wants more referrals but has no repeatable request system.'
    ],
    solutionCategories: [
      {
        title: 'Review automation tools',
        body: 'Best when the service experience is solid and the bottleneck is consistency.'
      },
      {
        title: 'Closeout message templates',
        body: 'Best when the team needs stronger wording and timing before buying another tool.'
      },
      {
        title: 'Operating systems with customer follow-up flow',
        body: 'Best when reputation is only one symptom of a weak overall customer workflow.'
      }
    ],
    recommendedReviews: ['nicejob', 'jobber', 'housecall-pro'],
    recommendedComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    recommendedTemplates: ['review-request-texts', 'bad-review-response-examples', 'job-completion-recap-templates'],
    roiFactors: [
      'Completed jobs per month.',
      'Current ask rate and current review completion rate.',
      'How visible local proof is in your core service area.',
      'Whether the sales team is losing trust at the top of the funnel.'
    ],
    faqs: [
      {
        question: 'Why do review tools fail for some contractors?',
        answer:
          'Because the closeout process is weak. If nobody triggers the request at the right time, the automation has nothing reliable to run from.'
      }
    ]
  },
  {
    slug: 'office-admin',
    title: 'Less office admin and repetitive communication',
    description:
      'Office drag shows up in all the little tasks that steal time: drafting the same messages, summarizing calls, updating customers, and chasing missing details.',
    whyItMatters:
      'Admin friction quietly eats owner attention and slows every customer handoff. This is where AI support can help, but only after the team knows the standard workflow.',
    symptoms: [
      'The same customer messages get rewritten all day long.',
      'Internal handoffs depend on memory instead of a repeatable SOP.',
      'The owner still writes too many customer-facing responses.',
      'Important admin tasks slip because nobody owns the next step clearly.'
    ],
    solutionCategories: [
      {
        title: 'AI drafting assistants',
        body: 'Best for writing, summarizing, SOP drafting, and message cleanup.'
      },
      {
        title: 'Workflow automation',
        body: 'Best when the team already knows the process and needs to reduce repeat clicks and alerts.'
      },
      {
        title: 'Operating systems',
        body: 'Best when office drag is coming from weak structure, not just weak writing.'
      }
    ],
    recommendedReviews: ['chatgpt', 'zapier', 'jobber'],
    recommendedComparisons: ['all-in-one-field-service-software-vs-separate-ai-tools'],
    recommendedTemplates: ['sop-prompts', 'job-completion-recap-templates', 'estimate-follow-up-sequences'],
    roiFactors: [
      'Hours spent every week on repeat customer messaging.',
      'How often handoffs break because the next step was unclear.',
      'How much owner time still gets consumed by admin drafting.',
      'Whether a better SOP could remove the task before new software is even needed.'
    ],
    faqs: [
      {
        question: 'What is the wrong way to use AI for office admin?',
        answer:
          'The wrong way is asking a tool to improvise customer commitments or automate a workflow no one has defined. Use AI to speed up a real process, not to invent one.'
      }
    ]
  }
];

export const legalPages = {
  about: {
    title: 'About ihelpwithai.com',
    intro:
      'ihelpwithai.com is being rebuilt as a practical buyer\'s guide for contractor and field-service businesses. The goal is to help a busy operator decide what to solve first, what to compare next, and what is probably not worth the time.',
    sections: [
      {
        title: 'What this site is trying to do',
        body:
          'This is not a giant AI directory for everyone. It is a decision engine for contractor owners, office managers, dispatchers, estimators, and GMs who want practical software guidance around lead response, quote follow-up, scheduling, reviews, and office admin.'
      },
      {
        title: 'What this site is not trying to do',
        body:
          'It is not trying to publish hype, chase every software release, or pretend every contractor needs the same stack. If a tool is not a realistic fit for the shop profile, that needs to be said clearly.'
      },
      {
        title: 'How the content is framed',
        body:
          'Recommendations are organized around trade fit, business bottlenecks, team size, budget posture, and setup reality. We care more about decision quality than about catalog size.'
      }
    ]
  },
  faq: {
    title: 'Frequently asked questions',
    faqs: [
      {
        question: 'Does every contractor business need AI right now?',
        answer:
          'No. Some businesses first need cleaner process, a stronger operating system, or more discipline around follow-up. AI helps most when it supports a known workflow instead of replacing judgment.'
      },
      {
        question: 'Why are some tools missing from the site?',
        answer:
          'Because breadth is not the goal. The goal is helping a contractor business decide between realistic next options instead of browsing hundreds of shallow entries.'
      },
      {
        question: 'Do you only recommend all-in-one field-service platforms?',
        answer:
          'No. Some businesses need all-in-one platforms first. Others should start with a focused phone, review, automation, or office-assistant tool. The site is built around that decision, not around one product category.'
      },
      {
        question: 'How should I use the site if I am short on time?',
        answer:
          'Start with the shortlist if you are not sure where to begin. If you already know the bottleneck, go to the problem hub. If you already have two options in mind, go straight to reviews or compare pages.'
      }
    ]
  },
  methodology: {
    title: 'Editorial methodology',
    intro:
      'Every review and comparison is supposed to answer a practical contractor question: is this worth looking at, which shop profile fits best, what setup pain is realistic, and what should you compare it against.',
    sections: [
      {
        title: 'How pages are evaluated',
        body:
          'Pages are framed around contractor workflows, trade fit, team-size fit, likely setup friction, and where the tool does not fit. If the downsides matter, they belong on the page.'
      },
      {
        title: 'How pricing is described',
        body:
          'We prefer pricing posture instead of invented tables when exact pricing is unclear or changes by sales process. The goal is to tell a buyer whether something feels lean, mid-range, or heavier to justify.'
      },
      {
        title: 'How recommendations are updated',
        body:
          'Review and compare pages carry a last reviewed date. The site should keep revisiting pages where product fit or buyer expectations have changed materially.'
      },
      {
        title: 'What the site will not do',
        body:
          'We do not want fake scores, fake testimonials, made-up ROI claims, or copy that hides implementation pain. A page should make the tradeoff easier to understand, not harder.'
      }
    ]
  },
  affiliateDisclosure: {
    title: 'Affiliate disclosure',
    intro:
      'Some pages may include affiliate or referral links. If you click one of those links and buy, ihelpwithai.com may earn a commission at no extra cost to you.',
    sections: [
      {
        title: 'What this means in practice',
        body:
          'Affiliate relationships should not hide tradeoffs or override fit. A tool page still needs to say who the tool is for, who it is not for, and what a buyer should watch out for.'
      },
      {
        title: 'How we try to keep trust intact',
        body:
          'Decision quality comes first. Pages should not read like vendor copy, and sponsored placement should be labeled clearly if it is ever introduced.'
      }
    ]
  },
  privacy: {
    title: 'Privacy',
    intro:
      'If you submit a form on this site, the information you provide is used to respond to your request, send the starter pack, or continue a conversation you initiated.',
    sections: [
      {
        title: 'What may be collected',
        body:
          'Basic contact details, trade context, and message content submitted through forms may be received through the connected form handler or email inbox.'
      },
      {
        title: 'How it is used',
        body:
          'Information is used to send requested resources, respond to inquiries, and understand what kinds of contractor questions the site should serve better.'
      },
      {
        title: 'What this page does not promise',
        body:
          'This page is a plain-language privacy summary, not a custom legal memo. If the site later adds richer analytics or email tooling, this page should be updated to reflect that change clearly.'
      }
    ]
  },
  terms: {
    title: 'Terms',
    intro:
      'Content on this site is for informational purposes and should support software research, not replace your own business judgment or legal, accounting, or implementation advice.',
    sections: [
      {
        title: 'Use of the site',
        body:
          'You can use the content to research tools, compare options, and contact the site about software questions. Do not treat a review or template as a guarantee of business results.'
      },
      {
        title: 'No warranty of fit',
        body:
          'Software fit depends on your trade, workflow, pricing model, staff habits, and implementation discipline. The site can narrow decisions, but it cannot guarantee the outcome of a purchase.'
      }
    ]
  },
  forVendors: {
    title: 'For vendors',
    intro:
      'Vendor submissions are welcome, but the main buyer journey is not built around vendor needs. If you want your product considered, send practical information that helps a contractor buyer understand fit.',
    sections: [
      {
        title: 'What to include',
        body:
          'Send the contractor use case, best-fit shop profile, setup expectations, integrations that matter, and the clearest reasons a buyer should still say no.'
      },
      {
        title: 'What not to send',
        body:
          'Please do not send generic AI hype decks, vague productivity language, or fake urgency. Practical clarity beats marketing gloss here.'
      }
    ]
  },
  starterPack: {
    title: 'Get the contractor AI starter pack',
    intro:
      'The starter pack is built to help a contractor business act before it buys more software. It bundles missed-call texts, estimate follow-up examples, review requests, one SOP prompt pack, and a simple decision checklist.',
    bullets: [
      'Missed-call text examples',
      'Estimate follow-up sequence',
      'Review request messages',
      'SOP prompt pack for office workflows',
      'Simple software decision checklist'
    ]
  },
  contact: {
    title: 'Contact',
    intro:
      'Use this page if you want help thinking through the first software decision, want to suggest a tool or workflow to review, or need help understanding where your contractor stack is leaking.',
    bullets: [
      'Questions about trade-specific fit',
      'Questions about which bottleneck to solve first',
      'Suggestions for future review or compare pages'
    ]
  },
  thankYou: {
    title: 'Thank you',
    intro:
      'Thanks for reaching out. The request is on its way, and someone will follow up using the details you submitted.'
  }
};

function withHtmlAndIndexRedirects(paths, targetRoute) {
  return Object.fromEntries(
    paths.flatMap((relativePath) => {
      const entries = [[relativePath, targetRoute]];
      if (relativePath.endsWith('.html') && relativePath !== 'index.html') {
        entries.push([relativePath.replace(/\.html$/, '/index.html'), targetRoute]);
      }
      return entries;
    })
  );
}

const legacyGuidePaths = [
  'guides/best-ai-tools-for-automation.html',
  'guides/best-ai-tools-for-design.html',
  'guides/best-ai-tools-for-marketing.html',
  'guides/best-ai-tools-for-meetings.html',
  'guides/best-ai-tools-for-presentations.html',
  'guides/best-ai-tools-for-productivity.html',
  'guides/best-ai-tools-for-research.html',
  'guides/best-ai-tools-for-sales.html',
  'guides/best-ai-tools-for-seo.html',
  'guides/best-ai-tools-for-support.html',
  'guides/best-ai-tools-for-training.html',
  'guides/best-ai-tools-for-video.html',
  'guides/best-ai-tools-for-voice.html',
  'guides/best-ai-tools-for-writing.html'
];

const legacyComparisonPaths = [
  'comparisons/canva-ai-vs-gamma.html',
  'comparisons/chatgpt-vs-claude-vs-gemini.html',
  'comparisons/elevenlabs-vs-murf.html',
  'comparisons/fathom-vs-fireflies-vs-otter.html',
  'comparisons/fireflies-vs-otter.html',
  'comparisons/gamma-vs-beautiful-ai.html',
  'comparisons/heygen-vs-synthesia.html',
  'comparisons/perplexity-vs-chatgpt-for-research.html',
  'comparisons/runway-vs-synthesia.html'
];

const legacyToolReviewPaths = {
  'tools/chatgpt.html': '/reviews/chatgpt/',
  'tools/zapier.html': '/reviews/zapier/',
  'tools/jobber.html': '/reviews/jobber/',
  'tools/housecall-pro.html': '/reviews/housecall-pro/',
  'tools/callrail.html': '/reviews/callrail/'
};

export const compatibilityRedirects = {
  'learn-ai.html': '/learn/',
  'learn-ai/index.html': '/learn/',
  'editorial-methodology.html': '/methodology/',
  'editorial-methodology/index.html': '/methodology/',
  'comparisons.html': '/compare/',
  'comparisons/index.html': '/compare/',
  'thanks.html': '/thank-you/',
  'thanks/index.html': '/thank-you/',
  'estimate-follow-up.html': '/problems/quote-follow-up/',
  'estimate-follow-up/index.html': '/problems/quote-follow-up/',
  'dispatch-scheduling.html': '/problems/scheduling-dispatch/',
  'dispatch-scheduling/index.html': '/problems/scheduling-dispatch/',
  'reviews-referrals.html': '/problems/reviews-referrals/',
  'reviews-referrals/index.html': '/problems/reviews-referrals/',
  'review-requests.html': '/problems/reviews-referrals/',
  'review-requests/index.html': '/problems/reviews-referrals/',
  'office-admin.html': '/problems/office-admin/',
  'office-admin/index.html': '/problems/office-admin/',
  'missed-calls.html': '/problems/missed-calls/',
  'missed-calls/index.html': '/problems/missed-calls/',
  'directory.html': '/shortlist/',
  'directory/index.html': '/shortlist/',
  'companies.html': '/reviews/',
  'companies/index.html': '/reviews/',
  'best-free-ai-tools.html': '/shortlist/',
  'best-free-ai-tools/index.html': '/shortlist/',
  'submit-app.html': '/for-vendors/',
  'submit-app/index.html': '/for-vendors/',
  'get-help.html': '/contact/',
  'get-help/index.html': '/contact/',
  'contractors.html': '/',
  'contractors/index.html': '/',
  ...withHtmlAndIndexRedirects(legacyGuidePaths, '/learn/'),
  ...withHtmlAndIndexRedirects(legacyComparisonPaths, '/compare/'),
  ...Object.fromEntries(
    Object.entries(legacyToolReviewPaths).flatMap(([relativePath, targetRoute]) => {
      const entries = [[relativePath, targetRoute]];
      entries.push([relativePath.replace(/\.html$/, '/index.html'), targetRoute]);
      return entries;
    })
  )
};
