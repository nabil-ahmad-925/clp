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
    posts: [
      {
        title: "Rivaldo and Fernando Morientes in Boston: Inside the LALIGA x Walmart Legendary Kickoff",
        href: "/rivaldo-and-fernando-morientes-in-boston-inside-the-laliga-x-walmart-legendary-kickoff/",
        image: upload('/2026/06/20260626_172607-scaled.jpg'),
        alt: "Compete Like pros",
        date: "June 26, 2026"
      },
      {
        title: "Athlete Performance Training: Proven Methods to Elevate Your Game",
        href: "/athlete-performance-training-proven-methods-to-elevate-your-game/",
        image: upload('/2025/07/Athlete-Performance-Training-Proven-Methods-to-Elevate-Your-Game.png'),
        alt: "Athlete Performance Training",
        date: "July 13, 2025"
      },
      {
        title: "Are Basketball Shoes Good for Running? Know the Facts",
        href: "/are-basketball-shoes-good-for-running-know-the-facts/",
        image: upload('/2025/07/adidas-d-o-n-issue-6-main-2-22673422-main-scaled.webp'),
        alt: "Are Basketball Shoes Good for Running? Know the Facts",
        date: "May 10, 2025"
      },
      {
        title: "How to Get Sponsored as an Athlete: Proven Strategies to Attract Brand Deals",
        href: "/how-to-get-sponsored-as-an-athlete-proven-strategies-to-attract-brand-deals/",
        image: upload('/2025/07/pexels-nappy-936094.jpg'),
        alt: "Athlete Sponser",
        date: "April 16, 2025"
      },
      {
        title: "Why Is Sports Marketing Important for Modern Athletes?",
        href: "/why-is-sports-marketing-important-for-modern-athletes/",
        image: upload('/2025/07/premium_photo-1661677875843-5c66d889cfe9-scaled.jpeg'),
        alt: "",
        date: "April 11, 2025"
      }
    ],
    viewAll: {
      label: "View all",
      href: "/branded-activations-2/"
    }
  },
  {
    title: "Briefings & Field Reports",
    layout: "masonry",
    spacing: {
      top: 5,
      bottom: 10
    },
    posts: [
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
      label: "View all",
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
      label: "View all",
      href: "/diet-recovery-injury-prevention-recovery/"
    }
  },
  {
    title: "PRODUCT DEVELOPMENT & REVIEWS",
    layout: "masonry",
    spacing: {
      top: 5,
      bottom: 10
    },
    posts: [
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
      },
      {
        title: "Are Basketball Shoes Good for Running? Know the Facts",
        href: "/are-basketball-shoes-good-for-running-know-the-facts/",
        image: upload('/2025/07/adidas-d-o-n-issue-6-main-2-22673422-main-scaled.webp'),
        alt: "Are Basketball Shoes Good for Running? Know the Facts"
      }
    ],
    viewAll: {
      label: "View all",
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
      label: "View all",
      href: "/resilience-performance-training/"
    }
  },
  {
    title: "Strategy and Insights",
    layout: "masonry",
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
      }
    ],
    viewAll: {
      label: "View all",
      href: "/strategy-insights/"
    }
  }
];
