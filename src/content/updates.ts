// Content for /updates/ (Updates & News), from the original site.
// Articles link to the posts on the live site.
import type { PostSectionData } from './types';
import { upload } from './site';

export const updatesMeta = {
  title: "Sports News Headlines & Updates: Compete Like Pros™",
  description: "Catch the latest sports update news, highlights, and trending stories. Stay informed with timely updates from across the sports world."
};

export const updatesSections: PostSectionData[] = [
  {
    title: "Activations & Branded Experiences",
    layout: "carousel",
    spacing: {
      top: 4,
      bottom: 4
    },
    posts: [],
    viewAll: {
      label: "View All",
      href: "/branded-activations-2/"
    }
  },
  {
    title: "Briefings & Field Reports",
    layout: "masonry",
    smallSides: true,
    spacing: {
      top: 5,
      bottom: 10
    },
    posts: [
      {
        title: "Barbie and Hot Wheels at the Meijer LPGA Classic: Inside the Mattel Mini Golf Activation",
        href: "/barbie-and-hot-wheels-at-the-meijer-lpga-classic-inside-the-mattel-mini-golf-activation/",
        image: upload('/2026/06/20260619_092246-scaled.jpg'),
        alt: "Compete Like pros"
      },
      {
        title: "Frantzdy Pierrot Day: Inside the Massachusetts State House Ceremony",
        href: "/frantzdy-pierrot-day-inside-the-massachusetts-state-house-ceremony-that-honored-haitis-world-cup-striker/",
        image: upload('/2026/05/20260526_135237.jpg.png'),
        alt: "Compete Like pros"
      },
      {
        title: "Can Basketball Make You Taller? Science Behind the Claim",
        href: "/can-basketball-make-you-taller-science-behind-the-claim/",
        image: upload('/2025/03/Basketball-Large.png'),
        alt: ""
      },
      {
        title: "Top Sports Industry Trends Every US Athlete and Sports Enthusiast Should Know",
        href: "/top-sports-industry-trends-every-us-athlete-and-sports-enthusiast-should-know/",
        image: upload('/2025/07/2024-09-17-092913722-Global_sports_industry_on_track_for_more_growth.jpg'),
        alt: ""
      }
    ],
    viewAll: {
      label: "View All",
      href: "/briefs-field-reports/"
    }
  },
  {
    title: "Diet, Recovery & Injury Prevention",
    layout: "carousel",
    spacing: {
      top: 4,
      bottom: 4
    },
    posts: [
      {
        title: "Mastering the Athlete Routine for Peak Performance",
        href: "/mastering-the-athlete-routine-for-peak-performance/",
        image: upload('/2025/07/pocket-watch-3156771_640.jpg'),
        alt: "Athlete Routine",
        date: "June 16, 2025"
      },
      {
        title: "The Critical Role of Diet in Achieving Fitness Goals",
        href: "/the-critical-role-of-diet-in-achieving-fitness-goals/",
        image: upload('/2025/07/Top-10-Fitness-Goals-You-Need-To-Set-For-Yourself.jpg'),
        alt: "Fitness Goals",
        date: "May 3, 2025"
      },
      {
        title: "Are Soccer and Football Cleats the Same? Know the Key Differences",
        href: "/are-soccer-and-football-cleats-the-same-know-the-key-differences/",
        image: upload('/2025/07/il_fullxfull.3871160880_9klw.webp'),
        alt: "Football Cleats",
        date: "March 16, 2025"
      },
      {
        title: "Hydration or Hype: Are Sports Drinks Bad for You and Your Game?",
        href: "/hydration-or-hype-are-sports-drinks-bad-for-you-and-your-game/",
        image: upload('/2025/07/230710145543-01-card-sports-drinks-caffeine-children-wellness-stock.jpg'),
        alt: "Sports Drinks",
        date: "March 7, 2025"
      }
    ],
    viewAll: {
      label: "View All",
      href: "/diet-recovery-injury-prevention-recovery/"
    }
  },
  {
    title: "PRODUCT DEVELOPMENT & REVIEWS",
    layout: "masonry",
    smallSides: true,
    spacing: {
      top: 5,
      bottom: 10
    },
    posts: [
      {
        title: "Pickup Soccer in Boston: Inside a Summer of Open Play, World Cup Watch Parties and the Mini Goal Challenge",
        href: "/pickup-soccer-in-boston-inside-a-summer-of-open-play-world-cup-watch-parties-and-the-mini-goal-challenge/",
        image: upload('/2026/06/20260628_1218401-scaled.jpg'),
        alt: "Compete Like pros"
      },
      {
        title: "Can Basketball Make You Taller? Science Behind the Claim",
        href: "/can-basketball-make-you-taller-science-behind-the-claim/",
        image: upload('/2025/03/Basketball-Large.png'),
        alt: ""
      },
      {
        title: "Are Soccer Socks Compression Socks? The Truth Behind Performance Gear Every Athlete Should Know",
        href: "/are-soccer-socks-compression-socks-the-truth-behind-performance-gear-every-athlete-should-know/",
        image: upload('/2025/07/IMG_9982-scaled.jpg'),
        alt: "Soccer Socks"
      }
    ],
    viewAll: {
      label: "View All",
      href: "/product-reviews/"
    }
  },
  {
    title: "RESILIENCE, PERFORMANCE & TRAINING",
    layout: "carousel",
    spacing: {
      top: 4,
      bottom: 4
    },
    posts: [
      {
        title: "Athlete Stretching Routine: Unlock Flexibility & Prevent Injuries",
        href: "/athlete-stretching-routine-unlock-flexibility-prevent-injuries/",
        image: upload('/2025/07/360_F_165714815_5dzk5m3qYVLlQL7PO0XbNPw9TVvQeTkZ.jpg'),
        alt: "Athlete Stretching",
        date: "May 16, 2025"
      },
      {
        title: "What Sports Psychologist Do: Athlete Mindset Guide",
        href: "/what-sports-psychologist-do-athlete-mindset-guide/",
        image: upload('/2025/07/AdobeStock_51102904-scaled-e1662602430373.webp'),
        alt: "",
        date: "May 9, 2025"
      },
      {
        title: "Athlete Strength Workout: Build Power with Proven Training for Modern Sports Enthusiasts",
        href: "/athlete-strength-workout-build-power-with-proven-training-for-modern-sports-enthusiasts/",
        image: upload('/2025/07/Free_Squat-7_25_24_-6_1024x1024.webp'),
        alt: "Athlete Strength Workout",
        date: "May 2, 2025"
      },
      {
        title: "Top Strength and Conditioning Programs for Peak Performance",
        href: "/top-strength-and-conditioning-programs-for-peak-performance/",
        image: upload('/2025/07/photo-1517838277536-f5f99be501cd.jpg'),
        alt: "",
        date: "January 10, 2025"
      }
    ],
    viewAll: {
      label: "View All",
      href: "/resilience-performance-training/"
    }
  },
  {
    title: "Strategy and Insights",
    layout: "masonry",
    smallSides: true,
    spacing: {
      top: 4,
      bottom: 4
    },
    posts: [
      {
        title: "Are Soccer Socks Compression Socks? The Truth Behind Performance Gear Every Athlete Should Know",
        href: "/are-soccer-socks-compression-socks-the-truth-behind-performance-gear-every-athlete-should-know/",
        image: upload('/2025/07/IMG_9982-scaled.jpg'),
        alt: "Soccer Socks"
      },
      {
        title: "How Business Analytics Can Be Used in Sports for Winning Results",
        href: "/how-business-analytics-can-be-used-in-sports-for-winning-results/",
        image: upload('/2025/07/Athlete-Performance-Training-Proven-Methods-to-Elevate-Your-Game.png'),
        alt: "Athlete Performance Training"
      },
      {
        title: "How to Learn Sports Analytics: A Guide for US Sportspersons and Enthusiasts",
        href: "/how-to-learn-sports-analytics-a-guide-for-us-sportspersons-and-enthusiasts/",
        image: upload('/2025/07/ext-1.jpeg'),
        alt: "Sports Analytics"
      },
      {
        title: "How Athletes Train: Secrets Behind Peak Performance",
        href: "/how-athletes-train-secrets-behind-peak-performance/",
        image: upload('/2025/07/how-to-train-like-an-athlete.webp'),
        alt: "How Athletes Train"
      }
    ],
    viewAll: {
      label: "View All",
      href: "/strategy-insights/"
    }
  },
  {
    title: "Transfers & Scouting",
    layout: "carousel",
    spacing: {
      top: 4,
      bottom: 4
    },
    // A new category: its articles come from the API (no built-in posts).
    posts: [],
    viewAll: {
      label: "View All",
      href: "/transfers-scouting/"
    }
  }
];

/** Each category's label on cards ("FIELD REPORTS") and line under its heading on Updates & News (the new design). */
export const updatesTopics: Record<string, { short: string; desc: string }> = {
  'activations-branded-experiences': { short: 'ACTIVATIONS', desc: 'Inside CLP events, brand kickoffs and fan experiences.' },
  'briefings-field-reports': { short: 'FIELD REPORTS', desc: 'News, ceremonies and what we’re seeing in the industry.' },
  'diet-recovery-injury-prevention': { short: 'DIET & RECOVERY', desc: 'Fueling, hydration and staying healthy, reviewed by experts.' },
  'product-development-reviews': { short: 'PRODUCT REVIEWS', desc: 'Gear, footwear and what actually works.' },
  'resilience-performance-training': { short: 'PERFORMANCE', desc: 'Strength, mobility and mindset for athletes.' },
  'strategy-and-insights': { short: 'STRATEGY', desc: 'Branding, sponsorship and the business of sport.' },
  'transfers-scouting': { short: 'TRANSFERS & SCOUTING', desc: 'Player moves, recruiting and the scouts finding the next talent.' },
};
