// Content for the sport pages (/experiences/* and /resources/*), extracted from the original site.
import type { SportPage } from './types';
import { upload } from './site';

export const sportPages: SportPage[] = [
  {
    section: "experiences",
    slug: "baseball",
    meta: {
      title: "Baseball Academies Near Me: Compete Like Pros™",
      description: "Join exciting baseball tournaments designed for athletes of all levels. Compete, learn, and grow your skills in professional facilities."
    },
    hero: {
      title: [
        "Baseball & Softball",
        "Experiences"
      ],
      backgroundImage: upload('/2024/03/tt.jpg'),
      backgroundColor: "#000000"
    },
    quotes: [
      {
        text: "“Baseball is ninety percent mental. The other half is physical.”",
        author: "– YOGI BERRA"
      },
      {
        text: "“Never limit yourself, never be satisfied, and smile—it’s free!”",
        author: "– JENNIE FINCH"
      },
      {
        text: "“There may be people that have more talent than you, but there’s no excuse for anyone to work harder than you do.”",
        author: "– DEREK JETER"
      },
      {
        text: "“You owe it to yourself to be the best you can possibly be – in baseball and in life.”",
        author: "- PETE ROSE"
      },
      {
        text: "\"Never allow the fear of striking out keep you from playing the game.\"",
        author: "- BABE RUTH"
      },
      {
        text: "\"Statistics are like bikinis—they show a lot but not everything.\"",
        author: "- LOU PINIELLA"
      }
    ],
    features: [
      {
        title: "ADVANCEMENT & WORKSHOPS",
        text: "Sharpen your edge with expert-led clinics covering mechanics, game IQ, and the mental side of the diamond.",
        image: upload('/2024/04/CLP-Photos-Advancement.png'),
        cta: {
          label: "Learn More",
          href: "/advancement-workshops-baseball-softball/"
        }
      },
      {
        title: "BRANDED ACTIVATIONS",
        text: "We team up with top brands to create activations that bring the energy of the ballpark to communities everywhere.",
        image: upload('/2024/04/Baseball-activation.png'),
        cta: {
          label: "Learn More",
          href: "/branded-activations-baseball-softball/"
        }
      },
      {
        title: "CAMPS/TOURNAMENTS",
        text: "Step up to the plate. Our camps and tournaments are built for every level—from first-timers to travel-ball veterans.",
        image: upload('/2024/03/CLP-Photos-Baseball-Camps.png'),
        cta: {
          label: "Learn More",
          href: "/camps-tournaments-baseball-softball/"
        }
      },
      {
        title: "GROUPS/PRIVATE LESSONS",
        text: "Train your way—group sessions for team chemistry or private coaching to dial in your swing, arm slot, or defensive reads.",
        image: upload('/2024/03/CLP-Photos-Baseball-Group-Lessons.png'),
        cta: {
          label: "Learn More",
          href: "/baseball-softball-coaches-nearby/"
        }
      },
      {
        title: "LEAGUES/SOCIAL CLUBS",
        text: "Find your league. Whether you're chasing wins or just chasing fly balls with friends, we've got a diamond for you.",
        image: upload('/2024/04/CLP-baseball-league.png'),
        cta: {
          label: "Learn More",
          href: "/leagues-social-clubs-baseball-softball/"
        }
      },
      {
        title: "TRIPS/RETREATS",
        text: "Train, travel, and connect. From spring training destinations to iconic ballparks, our trips combine elite development with unforgettable experiences.",
        image: upload('/2025/07/Trips-and-retreats.png'),
        cta: {
          label: "Learn More",
          href: "/baseball-softball-trips-retreats/"
        }
      },
      {
        title: "VOLUNTEERING/OPEN PLAY",
        text: "Get in the game. Open play and volunteer opportunities put community at the heart of every inning.",
        image: upload('/2024/03/CLP-Photos-for-Volunteering.png'),
        cta: {
          label: "Learn More",
          href: "https://link.heylo.co/wLeN",
          newTab: true
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2024/04/Baseball.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2024/04/Partner-Large-Photo.png'),
          cta: {
            label: "Book Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Back-bay-clemente.png'),
          subtitle: "Clemente Field",
          title: "BACK BAY - FENWAY (BOSTON)",
          excerpt: "Clemente Field sits in the heart of the Fens—Boston's original green space. Train where generations of ballplayers have sharpened their game.",
          bio: "Back Bay Fens baseball field offers a historic and well-maintained space where athletes and teams can train, compete, and enjoy the game in Boston.",
          bioImage: upload('/2025/03/Baseball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/wLeN"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Memorial-park.png'),
          subtitle: "Memorial Park",
          title: "EASTIE (BOSTON)",
          excerpt: "Memorial Park is the heartbeat of East Boston baseball—a neighborhood diamond built for competition, connection, and community pride.",
          bio: "East Boston Memorial Park features well-maintained baseball fields, providing athletes and teams a premier space for games, training, and community play in Boston.",
          bioImage: upload('/2025/03/Baseball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/wLeN"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Langone-Park.png'),
          subtitle: "Langone Park",
          title: "NORTH END (BOSTON)",
          excerpt: "Play with the harbor at your back. Langone Park delivers one of Boston's most iconic settings—where the North End's legendary energy meets the field.",
          bio: "Langone Park features scenic waterfront baseball fields, offering athletes and teams a premier space for games, training, and community engagement in Boston.",
          bioImage: upload('/2025/03/Baseball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/wLeN"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/book-a-session/baseball-experience/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Baseball-Content-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/branded-activations-2/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Baseball-Content-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/baseball/photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Baseball-Content-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "BASEBALL & SOFTBALL EXPERIENCES FAQ's",
      items: [
        {
          question: "What types of baseball experiences do you offer?",
          answer: "Training camps, skills clinics, coaching sessions, friendly games, tournaments, and baseball-themed trips to iconic stadiums and cities are just some of the baseball experiences we offer."
        },
        {
          question: "Are your baseball experiences suitable for all skill levels?",
          answer: "We offer experiences for players of all skill levels, from beginners to advanced. To ensure a rewarding experience for everyone, we tailor our sessions and activities to suit different skill levels."
        },
        {
          question: "What ages are your baseball experiences suitable for?",
          answer: "Baseball experiences are tailored to participants of all ages, including youth players, adults, and families. The activities and coaching we offer are age-appropriate to ensure that all age groups have a positive and enjoyable experience."
        },
        {
          question: "Do I need to bring my own baseball gear?",
          answer: "We provide some basic equipment, such as baseballs and bats, but we recommend that participants bring their own equipment, including gloves, cleats, helmets, and appropriate attire."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/baseball/"
      }
    }
  },
  {
    section: "experiences",
    slug: "basketball-2",
    meta: {
      title: "Basketball Tournaments & Training: Compete Like Pros™",
      description: "Discover thrilling basketball events and experiences. From tournaments to camps, we provide opportunities to play, learn, and enjoy."
    },
    hero: {
      title: [
        "Basketball",
        "Experiences"
      ],
      backgroundImage: upload('/2024/04/Basketball-main.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“ You can practice shooting eight hours a day, but if your technique is wrong, then all you become is very good at shooting the wrong way. Get the fundamentals down and the level of everything you do will rise.”",
        author: "- MICHAEL JORDAN"
      },
      {
        text: "“As an athlete, as long as you’re being authentic to who you are, then I don’t think you can do any wrong with sports off the court, on the court.”",
        author: "– CANDACE PARKER"
      },
      {
        text: "“Ask not what your teammates can do for you. Ask what you can do for your teammates.”",
        author: "- MAGIC JOHNSON"
      },
      {
        text: "“ Basketball is like war in that offensive weapons are developed first, and it always takes a while for the defense to catch up.”",
        author: "- RED AUERBACH"
      },
      {
        text: "“Everything negative — pressure, challenges — are all an opportunity for me to rise.”",
        author: "- KOBE BRYANT"
      },
      {
        text: "“ I have all the confidence in the world in this group, and they believe right back in me.”",
        author: "- CAITLIN CLARK"
      },
      {
        text: "“ Do your best when no one is looking. If you do that, then you can be successful at anything you put your mind to.”",
        author: "- BOB COUSY"
      },
      {
        text: "“ Basketball isn’t just a sport. It is an art, one that must be mastered to succeed.”",
        author: "- STEPH CURRY"
      }
    ],
    features: [
      {
        title: "ADVANCEMENT & WORKSHOPS",
        text: "Level up with expert-led education designed to elevate your game and career—on and off the court.",
        image: upload('/2024/04/CLP-Photos-Advancement.png'),
        cta: {
          label: "Learn More",
          href: "/advancement-workshops-basketball/"
        }
      },
      {
        title: "BRANDED ACTIVATIONS",
        text: "We partner with global brands to deliver high-impact activations that connect communities, amplify stories, and move culture forward.",
        image: upload('/2024/04/Basketball-Activation.png'),
        cta: {
          label: "Learn More",
          href: "/branded-activations-basketball/"
        }
      },
      {
        title: "CAMPS/TOURNAMENTS",
        text: "Compete, grow, and connect through camps and tournaments built for every skill level—where development meets real competition.",
        image: upload('/2024/04/CLP-basketball-camps.png'),
        cta: {
          label: "Learn More",
          href: "/camps-tournaments-basketball/"
        }
      },
      {
        title: "GROUPS/PRIVATE LESSONS",
        text: "Train your way. Whether group sessions or one-on-one coaching, every program is built around your goals.",
        image: upload('/2024/04/CLP-Photos-Basketball-Group-Lessons.png'),
        cta: {
          label: "Learn More",
          href: "/basketball-coaches-nearby/"
        }
      },
      {
        title: "LEAGUES/SOCIAL CLUBS",
        text: "Find your level. From competitive leagues to laid-back social clubs, there's a court for everyone.",
        image: upload('/2024/04/Basketball-league.png'),
        cta: {
          label: "Learn More",
          href: "/leagues-social-clubs-basketball/"
        }
      },
      {
        title: "TRIPS/RETREATS",
        text: "Elite training meets cultural immersion. Compete, recover, and connect in destinations that inspire growth.",
        image: upload('/2025/07/Trips-and-retreats.png'),
        cta: {
          label: "Learn More",
          href: "/basketball-softball-trips-retreats/"
        }
      },
      {
        title: "VOLUNTEERING/OPEN PLAY",
        text: "Show up. Give back. Our open play sessions and volunteer opportunities put community at the center of the game.",
        image: upload('/2024/03/CLP-Photos-for-Volunteering.png'),
        cta: {
          label: "Learn More",
          href: "https://link.heylo.co/9t4N",
          newTab: true
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2024/04/Basketball.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/07/Basketball-1.png'),
          cta: {
            label: "Book Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Lopresti-bball.png'),
          subtitle: "LoPresti Park",
          title: "EASTIE (BOSTON)",
          excerpt: "LoPresti brings waterfront basketball to Eastie—scenic courts with competitive runs and community pride.",
          bio: "LoPresti Park provides top-tier waterfront basketball courts, creating an energetic environment for players to compete, practice, and connect while enjoying stunning Boston Harbor views.",
          bioImage: upload('/2025/03/Basketball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/9t4N"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/back-bay-fen-basketball.png'),
          subtitle: "Clemente Courts",
          title: "BACK BAY - FENWAY (BOSTON)",
          excerpt: "Clemente Courts sit in the heart of Back Bay Fens—an outdoor hoops staple where players of all levels come to compete.",
          bio: "Back Bay Fens provides outdoor basketball courts, inviting athletes of all levels to play, practice, and engage in competitive games within a vibrant park atmosphere.",
          bioImage: upload('/2025/03/Basketball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/9t4N"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Smith-Playground-bball.png'),
          subtitle: "Smith Playground",
          title: "ALLSTON (BOSTON)",
          excerpt: "Smith Playground is the neighborhood's go-to—quality courts, good runs, and a community that shows up ready to play.",
          bio: "Smith Playground offers top-tier basketball courts, welcoming players of all levels to train, compete, and connect in an energetic community-driven sports environment in Boston.",
          bioImage: upload('/2025/03/Basketball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/9t4N"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/basketball-facilities-parks/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Basketball-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/branded-activations-2/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Basketball-content-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/basketball-2/photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Basketball-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "BASKETBALL EXPERIENCES FAQ's",
      items: [
        {
          question: "What types of basketball experiences do you offer?",
          answer: "We offer a variety of basketball experiences, including skills clinics, training camps, coaching sessions, pick-up games, tournaments, and basketball-themed trips to iconic courts and cities."
        },
        {
          question: "Are your basketball experiences suitable for all skill levels?",
          answer: "Players of all skill levels are welcome to participate in our experiences. Regardless of skill level, our activities and sessions are tailored to suit everyone’s needs."
        },
        {
          question: "What ages are your basketball experiences suitable for?",
          answer: "Basketball experiences are designed for players of all ages, including youth players, adults, and families. Age-appropriate activities and coaching ensure a positive and enjoyable experience for all ages."
        },
        {
          question: "Do I need to bring my own basketball gear?",
          answer: "Although we provide some basic equipment, such as balls and cones, we recommend that participants bring their own basketball gear, such as shoes, shorts, shirts, and appropriate attire for training and games."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/basketball/"
      }
    }
  },
  {
    section: "experiences",
    slug: "esports",
    meta: {
      title: "Esports Tournaments & Experiences: Compete Like Pros™",
      description: "Explore top esports facilities near me with tournaments, training, and private lessons. Level up your competitive gaming experience."
    },
    hero: {
      title: [
        "Esports",
        "Experiences"
      ],
      backgroundImage: upload('/2024/03/Esports-Action.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“Honor Is In The Heart, Not In The Name.”",
        author: "– YASUO"
      },
      {
        text: "\"The Right Man In The Wrong Place Can Make All The Difference In The World. So Wake Up Mr. Freeman, Wake Up And Smell The Ashes.\"",
        author: "- G-MAN(HALF-LIFE2)"
      },
      {
        text: "\"It's Dangerous To Go Alone! Take This.\"",
        author: "- OLD MAN(THE LEGEND OF ZELDA)"
      },
      {
        text: "\"No, you know about loss. Sacrifice is a choice you make. Loss is a choice made for you.\"",
        author: "- CONRAD ROTH (TOMB RAIDER)"
      },
      {
        text: "\"I Don't Need a Weapon; My Friends Are My Power!\"",
        author: "- SORA (KINGDOM HEARTS)"
      },
      {
        text: "\"It’s Time To Kick Ass And Chew Bubble Gum... And I’m All Outta Gum.\"",
        author: "– DUKE NUKEM (DUKE NUKEM SERIES)"
      }
    ],
    features: [
      {
        title: "ADVANCEMENT & WORKSHOPS",
        text: "Level up with coaching sessions that sharpen mechanics, game sense, and the mental edge that separates ranked from pro.",
        image: upload('/2024/04/CLP-Photos-Advancement.png'),
        cta: {
          label: "Learn More",
          href: "/advancement-workshops-esports/"
        }
      },
      {
        title: "BRANDED ACTIVATIONS",
        text: "We partner with top brands to create esports activations that bring competitive energy to events, communities, and content.",
        image: upload('/2024/04/CLP-Esport-Activation.png'),
        cta: {
          label: "Learn More",
          href: "/branded-activations-esports/"
        }
      },
      {
        title: "CAMPS/TOURNAMENTS",
        text: "Queue up. Our camps and tournaments are built for every skill tier—from casual grinders to competitive climbers.",
        image: upload('/2024/04/CLP-Photos-Esports-Camps.png'),
        cta: {
          label: "Learn More",
          href: "/camps-tournaments-esports/"
        }
      },
      {
        title: "GROUPS/PRIVATE LESSONS",
        text: "Train your way—squad sessions for team synergy or private coaching to refine your mechanics, positioning, and decision-making.",
        image: upload('/2024/04/CLP-Photos-Esports-Group-Lessons.png'),
        cta: {
          label: "Learn More",
          href: "/esports-private-coaches-nearby/"
        }
      },
      {
        title: "LEAGUES/SOCIAL CLUBS",
        text: "Find your lobby. Competitive leagues for ranked players. Social clubs for those who just want to run games with good people.",
        image: upload('/2024/04/Esports-League.png'),
        cta: {
          label: "Learn More",
          href: "/leagues-social-clubs-esports/"
        }
      },
      {
        title: "TRIPS/RETREATS",
        text: "Boot camps and LAN events in destinations built for focus, competition, and connection. Train hard. Play harder.",
        image: upload('/2025/07/Trips-and-retreats.png'),
        cta: {
          label: "Learn More",
          href: "/esports-trips-retreats/"
        }
      },
      {
        title: "VOLUNTEERING/OPEN PLAY",
        text: "Drop in. Get on the sticks. Our open play and volunteer programs put community at the center of gaming culture.",
        image: upload('/2024/03/CLP-Photos-for-Volunteering.png'),
        cta: {
          label: "Learn More",
          href: "https://link.heylo.co/R5kh",
          newTab: true
        }
      }
    ],
    facilities: {
      title: "FACILITIES & VENUES NEARBY FOR PLAYING",
      items: [
        {
          image: upload('/2024/04/Esports.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/balance-patch.png'),
          subtitle: "Balance Patch",
          title: "(BOSTON)",
          excerpt: "Balance Patch is where serious players compete—high-performance setups, tournament-ready environment, and a community that shows up to win.",
          bio: "Balance Patch is Boston’s premier esports lounge, offering top-tier gaming setups, tournaments, and a vibrant community for competitive and casual gamers alike.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Mixer-sports.png'),
          subtitle: "Mixer eSports + Cafe",
          title: "(MALDEN)",
          excerpt: "Mixer blends esports and social—top-tier rigs, regular tournaments, and a café vibe that makes it easy to stay and play.",
          bio: "Mixer eSports + Cafe blends gaming and community, offering high-end setups, tournaments, and a social hub for casual and competitive gamers in Boston.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2024/04/Esports.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/esports-facilties-nearby/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Esports-1-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/branded-activations-2/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Esports-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/esports/esports-photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Esports-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "ESPORTS EXPERIENCES FAQ's",
      items: [
        {
          question: "What types of eSports experiences do you offer?",
          answer: "Esports experiences include tournaments, gaming clinics, coaching sessions, esports camps, and esports-themed events."
        },
        {
          question: "Are your esports experiences suitable for all skill levels?",
          answer: "We offer experiences for gamers at all skill levels, from beginners to experts. Through our eSports partners, you’ll have the chance to learn, practice, and compete with other eSports enthusiasts."
        },
        {
          question: "What ages are your eSports experiences suitable for?",
          answer: "Participants of all ages can participate in our esports experiences, including juniors, adults, and competitive gamers. Our age-appropriate activities and coaching ensure that all participants have an enjoyable and rewarding experience."
        },
        {
          question: "Do I need to bring my own gaming equipment?",
          answer: "While our facilities provide gaming equipment, like gaming PCs, consoles, and peripherals, participants may bring their own gaming gear in some cases. This includes gaming mice, keyboards, controllers, and headsets."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/esports/"
      }
    }
  },
  {
    section: "experiences",
    slug: "futbol",
    meta: {
      title: "Private Soccer Lessons & Training: Compete Like Pros™",
      description: "Compete in soccer tournaments that challenge your skills. Join players, improve performance, and experience exciting global matches."
    },
    hero: {
      title: [
        "Fútbol (Soccer)",
        "Experiences"
      ],
      backgroundImage: upload('/2024/04/Futbol.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“The more difficult the victory, the greater the happiness in winning.”",
        author: "– PELÉ"
      },
      {
        text: "“I always try to be the best, but I want to do it playing well and with humility.”",
        author: "– LIONEL MESSI"
      },
      {
        text: "“The vision of a champion is someone who is bent over, drenched in sweat, at the point of exhaustion when no one else is watching.”",
        author: "– MIA HAMM"
      },
      {
        text: "“I once cried because I had no shoes to play soccer, but one day, I met a man who had no feet.”",
        author: "– ZINEDINE ZIDANE"
      },
      {
        text: "“Good soccer players need not only great footwork but also a big heart.”",
        author: "– ABBY WAMBACH"
      },
      {
        text: "“Talent is important, but it’s the effort that determines the level of your success.”",
        author: "– CRISTIANO RONALDO"
      },
      {
        text: "“When people succeed, it is because of hard work. Luck has nothing to do with success.”",
        author: "– DIEGO MARANDONA"
      }
    ],
    features: [
      {
        title: "ADVANCEMENT & WORKSHOPS",
        text: "Elevate your game with expert-led sessions on tactics, technical skills, and the mental edge that separates good players from great ones.",
        image: upload('/2024/04/CLP-Photos-Advancement.png'),
        cta: {
          label: "Learn More",
          href: "/advancement-workshops-futbol-soccer/"
        }
      },
      {
        title: "BRANDED ACTIVATIONS",
        text: "We partner with global brands to bring the beautiful game to communities—creating activations that connect culture, competition, and purpose.",
        image: upload('/2024/04/Soccer-ativations.png'),
        cta: {
          label: "Learn More",
          href: "/branded-activations-futbol-soccer/"
        }
      },
      {
        title: "CAMPS/TOURNAMENTS",
        text: "Compete at your level. Our camps and tournaments build skills, sharpen instincts, and bring players together from first touch to final whistle.",
        image: upload('/2024/04/CLP-Photos-Futbol-Camps.png'),
        cta: {
          label: "Learn More",
          href: "/camps-tournaments-futbol-soccer/"
        }
      },
      {
        title: "GROUPS/PRIVATE LESSONS",
        text: "Train your way—group sessions to build chemistry or private coaching to refine your touch, positioning, and decision-making.",
        image: upload('/2024/04/CLP-Photos-Futbol-Group-Lessons.png'),
        cta: {
          label: "Learn More",
          href: "/futbol-groups-private-coaches-nearby/"
        }
      },
      {
        title: "LEAGUES/SOCIAL CLUBS",
        text: "Find your pitch. From competitive leagues to social pickup, there's a place for every player ready to get on the ball.",
        image: upload('/2024/04/Futbol-League.png'),
        cta: {
          label: "Learn More",
          href: "/leagues-social-clubs-futbol-soccer/"
        }
      },
      {
        title: "TRIPS/RETREATS",
        text: "Train where the game lives. From iconic pitches to international destinations, our trips blend elite development with cultural immersion.",
        image: upload('/2025/07/Trips-and-retreats.png'),
        cta: {
          label: "Learn More",
          href: "/futbol-trips-retreats/"
        }
      },
      {
        title: "VOLUNTEERING/OPEN PLAY",
        text: "Show up. Get involved. Our open play and volunteer programs put community at the center of the game.",
        image: upload('/2024/03/CLP-Photos-for-Volunteering.png'),
        cta: {
          label: "Learn More",
          href: "https://link.heylo.co/TH7A",
          newTab: true
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2025/03/soccer-large-917x1024.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Contact LEARN MORE",
            href: "#"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Back-Bay-Fens-small.png'),
          subtitle: "Clemente Field",
          title: "BACK BAY -FENWAY (BOSTON)",
          excerpt: "Clemente Field sits at the heart of the Fens—open turf, an iconic setting, and space to train the way you play.",
          bio: "Clemente Field offers an open turf field, inviting athletes and teams to play, train, and enjoy the game in a scenic setting.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Lopresti-small-1.png'),
          subtitle: "LoPresti Park",
          title: "EASTIE (BOSTON)",
          excerpt: "LoPresti brings the harbor views and Eastie's competitive spirit together on one of Boston's best waterfront pitches.",
          bio: "LoPresti Park offers stunning waterfront soccer fields, creating an energetic environment for athletes, teams, and fans to train, compete, and enjoy the game in East Boston.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Carter-Playground-Full-small.png'),
          subtitle: "Carter Playground",
          title: "SOUTH END (BOSTON)",
          excerpt: "Carter Playground is a neighborhood hub—quality turf, strong community, and the kind of energy that makes you want to compete.",
          bio: "Carter Playground features high-quality soccer fields, offering athletes, teams, and fans a premier space for training, competition, and community engagement in Boston.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/futbolsoccer-facilties-nearby/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/04/Soccer-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/branded-activations-2/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Soccer-1-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/futbol/futbol-soccer-photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Soccer-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "FÚTBOL (SOCCER) EXPERIENCES FAQ's",
      items: [
        {
          question: "What types of soccer experiences do you offer?",
          answer: "As a soccer experience provider, we offer a variety of soccer-related activities, such as training camps, coaching clinics, friendly matches, tournaments, and trips to iconic soccer stadiums."
        },
        {
          question: "Are your soccer experiences suitable for all skill levels?",
          answer: "We offer experiences for players of all skill levels, from beginners to advanced. Sessions and activities are tailored to accommodate different skill levels and ensure that everyone has a rewarding experience."
        },
        {
          question: "What ages are your soccer experiences suitable for?",
          answer: "Our soccer experiences are designed for participants of various ages, including youth players, adults, and even families. We offer age-appropriate activities and coaching to ensure a positive and enjoyable experience for all age groups."
        },
        {
          question: "Do I need to bring my own soccer gear?",
          answer: "Participants should bring their own soccer gear, including cleats, shin guards, and appropriate attire for training or matches. We provide some basic equipment, such as balls and cones."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/futbol/"
      }
    }
  },
  {
    section: "experiences",
    slug: "golfing",
    meta: {
      title: "For Golfing - Compete Like Pros™",
      description: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally. Book NowRobert T."
    },
    hero: {
      title: [
        "Golfing",
        "Experiences"
      ],
      backgroundImage: upload('/2024/03/1686927118383.jpg'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“Success in this game depends less on strength of body than strength of mind and character.”",
        author: "- ARNOLD PALMER"
      },
      {
        text: "“The value of routine; trusting your swing.”",
        author: "- LORII MYERS"
      },
      {
        text: "“Achievements on the golf course are not what matter; decency and honesty are what matter.”",
        author: "- TIGER WOODS"
      },
      {
        text: "“Keep your sense of humor. There’s enough stress in the rest of your life not to let bad shots ruin a game you’re supposed to enjoy.”",
        author: "- AMY ALCOTT"
      },
      {
        text: "The more I work and practice, the luckier I seem to get.”",
        author: "- GARY PLAYER"
      }
    ],
    features: [
      {
        title: "ADVANCEMENT & WORKSHOPS",
        text: "Refine your game with expert-led workshops covering swing mechanics, course strategy, and the mental discipline that lowers scores.",
        image: upload('/2024/04/CLP-Photos-Advancement.png'),
        cta: {
          label: "Learn More",
          href: "/advancement-workshops-golf/"
        }
      },
      {
        title: "BRANDED ACTIVATIONS",
        text: "We partner with premium brands to create golf experiences that connect communities, elevate events, and drive engagement on and off the course.",
        image: upload('/2024/04/CLP-Golf-Activation.png'),
        cta: {
          label: "Learn More",
          href: "/branded-activations-golf/"
        }
      },
      {
        title: "CAMPS/TOURNAMENTS",
        text: "Tee it up. Our camps and tournaments are designed for every handicap—building fundamentals for beginners and sharpening skills for competitors.",
        image: upload('/2024/04/CLP-Photos-Golf-Camps.png'),
        cta: {
          label: "Learn More",
          href: "/camps-tournaments-golf/"
        }
      },
      {
        title: "GROUPS/PRIVATE LESSONS",
        text: "Train your way—group clinics for camaraderie or private instruction to dial in your swing, short game, and course management.",
        image: upload('/2024/04/CLP-Photos-Golf-Group-Lessons.png'),
        cta: {
          label: "Learn More",
          href: "/golfing-groups-private-coaches-nearby/"
        }
      },
      {
        title: "LEAGUES/SOCIAL CLUBS",
        text: "Find your foursome. Competitive leagues for players chasing low rounds. Social clubs for those chasing good company.",
        image: upload('/2024/04/Golfing-league.png'),
        cta: {
          label: "Learn More",
          href: "/leagues-social-clubs-golf/"
        }
      },
      {
        title: "TRIPS/RETREATS",
        text: "Play where it matters. Our golf retreats combine world-class courses, expert coaching, and destinations that inspire your best game.",
        image: upload('/2025/07/Trips-and-retreats.png'),
        cta: {
          label: "Learn More",
          href: "/golfing-trips-retreats/"
        }
      },
      {
        title: "VOLUNTEERING/OPEN PLAY",
        text: "Get involved. Our volunteer and open play programs bring golfers together to give back and grow the game.",
        image: upload('/2024/03/CLP-Photos-for-Volunteering.png'),
        cta: {
          label: "Learn More",
          href: "https://link.heylo.co/RF2U",
          newTab: true
        }
      }
    ],
    facilities: {
      title: "FACILITIES & CLUBS NEARBY",
      items: [
        {
          image: upload('/2024/04/Golfing-1.png'),
          subtitle: "Your Club",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2024/04/Partner-Large-Photo.png'),
          cta: {
            label: "Book Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Brookline-Golf-Course.png'),
          subtitle: "Robert T. Lynch Golf Course",
          title: "(BROOKLINE)",
          excerpt: "Lynch Golf Course delivers a legit test for every level—rolling fairways, solid conditions, and Brookline's understated prestige.",
          bio: "Robert T. Lynch Municipal Golf Course offers a scenic and challenging course, welcoming golfers of all levels for an enjoyable and competitive experience near Boston.",
          bioImage: upload('/2025/03/Golf-Putter.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/RF2U"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Gannon-Municipal-Golf.png'),
          subtitle: "Gannon Municipal Golf Course",
          title: "(LYNN, MA)",
          excerpt: "Gannon offers an honest round—scenic views, challenging layout, and the kind of course that rewards good shots.",
          bio: "Gannon Municipal Golf Course offers a scenic, challenging layout, providing golfers of all levels a top-tier playing experience in a picturesque setting near Boston.",
          bioImage: upload('/2025/03/Golf-Putter.png'),
          cta: {
            label: "Play Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Red-Tail-Golf-Club.png'),
          subtitle: "Red Tail Golf Club",
          title: "(DEVENS, MA)",
          excerpt: "Red Tail is the real deal—pristine conditions, strategic design, and a setting that makes every tee shot feel like it matters.",
          bio: "Red Tail Golf Club offers a championship-caliber course with scenic fairways, challenging holes, and a premier golfing experience set in a beautiful natural landscape.",
          bioImage: upload('/2025/03/Golf-Putter.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/RF2U"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/golfing-facilities-nearby/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Golf-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/branded-activations-2/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Golf-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/golfing/golfing-photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Golf-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "GOLFING EXPERIENCES FAQ's",
      items: [
        {
          question: "What types of golfing experiences do you offer?",
          answer: "Our golfing experiences include clinics, training sessions, tournaments, golfing getaways, and golf-themed trips to renowned courses and destinations."
        },
        {
          question: "Are your golfing experiences suitable for all skill levels?",
          answer: "Yes, our experiences are suitable for all levels of golfers. Each participant’s needs are met through personalized activities and coaching, ensuring that everyone has a rewarding experience."
        },
        {
          question: "What ages are your golfing experiences suitable for?",
          answer: "Participants of all ages are welcome to take part in our golfing experiences, from juniors to seniors. Our programs create an enjoyable and inclusive environment for all ages with age-appropriate instruction and activities."
        },
        {
          question: "Do I need to bring my own golf equipment?",
          answer: "While we provide basic golf equipment, such as clubs and balls, we recommend that players bring their own clubs, gloves, golf shoes, and appropriate attire to the course/experience."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/golfing/"
      }
    }
  },
  {
    section: "experiences",
    slug: "pickleball",
    meta: {
      title: "Pickleball Facilities Near Me: Compete Like Pros™",
      description: "Join fun pickleball trips and events with players of all levels. Travel, play, and build skills while enjoying the sport you love."
    },
    hero: {
      title: [
        "Pickleball",
        "Experiences"
      ],
      backgroundImage: upload('/2024/05/Pickleball-Lady-1.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "\"You play the ball. You don’t play the opponent. Be free in your head. Be free in your shots. Go for it.\"",
        author: "– RODGER FEDERER"
      },
      {
        text: "“Everything comes at a cost. Just what are you willing to pay for it?”",
        author: "– SERENA WILLIAMS"
      },
      {
        text: "“Tennis is not a gentle game. Psychologically, it is vicious.\"",
        author: "– RICHARD EVANS"
      },
      {
        text: "\"When you lose a couple of times, it makes you realize how difficult it is to win.\"",
        author: "- STEFFI GRAF"
      },
      {
        text: "“Success is a journey, not a destination. The doing is often more important than the outcome.”",
        author: "– ARTHUR ASHE"
      }
    ],
    features: [
      {
        title: "ADVANCEMENT & WORKSHOPS",
        text: "Level up with clinics that sharpen your strategy, footwork, and court IQ—designed for players ready to compete smarter.",
        image: upload('/2024/04/CLP-Photos-Advancement.png'),
        cta: {
          label: "Learn More",
          href: "/advancement-workshops-pickleball/"
        }
      },
      {
        title: "BRANDED ACTIVATIONS",
        text: "We team up with leading brands to bring high-energy pickleball activations to communities and events nationwide.",
        image: upload('/2024/05/branded-activation.png'),
        cta: {
          label: "Learn More",
          href: "/branded-activations-pickleball/"
        }
      },
      {
        title: "CAMPS/TOURNAMENTS",
        text: "Compete, connect, and improve. Our camps and tournaments are built for every skill level—from newcomers to tournament-tested players.",
        image: upload('/2024/04/CLP-Photos-Pickleball-Camps.png'),
        cta: {
          label: "Learn More",
          href: "/camps-tournaments-pickleball/"
        }
      },
      {
        title: "GROUPS/PRIVATE LESSONS",
        text: "Train your way—group sessions for social play or private coaching to tighten your dinks, drives, and court positioning.",
        image: upload('/2024/04/CLP-Photos-Pickleball-Group-Lessons.png'),
        cta: {
          label: "Learn More",
          href: "/pickleball-groups-private-coaches-nearby/"
        }
      },
      {
        title: "LEAGUES/SOCIAL CLUBS",
        text: "Find your court. Competitive leagues for those chasing wins. Social clubs for those chasing a good time. Both are welcome here.",
        image: upload('/2024/05/Leagues.png'),
        cta: {
          label: "Learn More",
          href: "/leagues-social-clubs-pickleball/"
        }
      },
      {
        title: "TRIPS/RETREATS",
        text: "Play Destination Pickleball. Our retreats combine elite instruction, recovery, and unforgettable experiences in inspiring locations.",
        image: upload('/2025/07/Trips-and-retreats.png'),
        cta: {
          label: "Learn More",
          href: "/pickleball-trips-retreats/"
        }
      },
      {
        title: "VOLUNTEERING/OPEN PLAY",
        text: "Drop in. Get on the court. Our open play sessions and volunteer programs make community the heart of the game.",
        image: upload('/2024/03/CLP-Photos-for-Volunteering.png'),
        cta: {
          label: "Learn More",
          href: "https://link.heylo.co/kosM",
          newTab: true
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2024/05/Pickleball.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Kendel-SQ.png'),
          subtitle: "Rooftop Garden",
          title: "KENDALL SQUARE (CAMBRIDGE)",
          excerpt: "Play above it all. Kendall Square's rooftop courts deliver competition with city views you won't find anywhere else.",
          bio: "Kendall Square Roof Garden features rooftop pickleball courts, blending competitive play with breathtaking city views, creating a one-of-a-kind experience for players of all levels in Cambridge.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Lawn-on-d-1.png'),
          subtitle: "Lawn on D",
          title: "SOUTHIE (BOSTON)",
          excerpt: "Lawn on D brings the social energy—open courts, good vibes, and a scene that makes every game feel like an event.",
          bio: "Lawn on D offers a lively pickleball space, combining fun, competition, and social play in a vibrant outdoor setting with a dynamic atmosphere.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Ink-block.png'),
          subtitle: "Underground at Ink Block",
          title: "SOUTH END (BOSTON)",
          excerpt: "Tucked beneath the highways of the South End, Underground at Ink Block is pickleball with an edge—gritty, social, and always buzzing.",
          bio: "Underground at Ink Block offers urban pickleball courts, blending competition, fitness, and community vibes in a vibrant space beneath Boston’s elevated highways.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/pickleball-facilities-parks/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Pickleball-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/branded-activations-2/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Pickleball-4-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/pickleball/tennis-pickleball-photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Pickleball-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "PICKLEBALL EXPERIENCES FAQ's",
      items: [
        {
          question: "What types of pickleball experiences do you offer?",
          answer: "Our pickleball experiences include clinics, training sessions, social play events, tournaments, and excursions themed around pickleball."
        },
        {
          question: "Are your pickleball experiences suitable for all skill levels?",
          answer: "Pickleball players of all skill levels are welcome at our experiences. Our program provides participants with opportunities for skill development, friendly matches, and competitive play tailored to their needs."
        },
        {
          question: "What ages are your pickleball experiences suitable for?",
          answer: "Participants of various ages can enjoy pickleball with us, including youth players, adults, and seniors. To ensure that all age groups have a rewarding and enjoyable experience, we offer age-appropriate activities and coaching."
        },
        {
          question: "Do I need to bring my own pickleball equipment?",
          answer: "While we provide pickleball equipment at our experiences, such as paddles, balls, and nets, participants are welcome to bring their own equipment. In this category, you will find pickleball shoes, apparel, and accessories."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/pickleball/"
      }
    }
  },
  {
    section: "resources",
    slug: "esports",
    meta: {
      title: "Esports Recovery & Performance: Compete Like Pros™",
      description: "Train at an esports center near me with cutting-edge setups, recovery programs, and professional player resources."
    },
    hero: {
      title: [
        "Esports",
        "Resources"
      ],
      backgroundImage: upload('/2024/03/Esports-Action.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“Honor Is In The Heart, Not In The Name.”",
        author: "– YASUO"
      },
      {
        text: "\"The Right Man In The Wrong Place Can Make All The Difference In The World. So Wake Up Mr. Freeman, Wake Up And Smell The Ashes.\"",
        author: "- G-MAN(HALF-LIFE2)"
      },
      {
        text: "\"It's Dangerous To Go Alone! Take This.\"",
        author: "- OLD MAN(THE LEGEND OF ZELDA)"
      },
      {
        text: "\"No, you know about loss. Sacrifice is a choice you make. Loss is a choice made for you.\"",
        author: "- CONRAD ROTH (TOMB RAIDER)"
      },
      {
        text: "\"I Don't Need a Weapon; My Friends Are My Power!\"",
        author: "- SORA (KINGDOM HEARTS)"
      },
      {
        text: "\"It’s Time To Kick Ass And Chew Bubble Gum... And I’m All Outta Gum.\"",
        author: "– DUKE NUKEM (DUKE NUKEM SERIES)"
      }
    ],
    features: [
      {
        title: "DIETING & NUTRITION",
        text: "Fuel your performance. Expert guidance on nutrition built to support how you train, recover, and compete.",
        image: upload('/2024/04/CLP-Photos-Dieting.png'),
        cta: {
          label: "Learn More",
          href: "/esports-dieting-nutrition/"
        }
      },
      {
        title: "JOBS/INTERNSHIPS",
        text: "Build your career in sports. Explore jobs and internships with organizations that value talent and ambition.",
        image: upload('/2024/04/CLP-Photos-Jobs.png'),
        cta: {
          label: "Learn More",
          href: "mailto:jobs@competelikepros.com"
        }
      },
      {
        title: "INJURY PREVENTION & RECOVERY",
        text: "Stay in the game. Resources and programs designed to keep your body moving, recovering, and performing at its best.",
        image: upload('/2024/04/CLP-Photos-Injury-Prevention-Recovery.png'),
        cta: {
          label: "Learn More",
          href: "/esports-injury-prevention-rehab-nearby/"
        }
      },
      {
        title: "MENTAL HEALTH & RESILIENCE",
        text: "Train the mind like you train the body. Tools and support to build mental strength, focus, and resilience—on and off the field.",
        image: upload('/2024/04/Wellness.png'),
        cta: {
          label: "Learn More",
          href: "/esports-mental-health-resilience/"
        }
      },
      {
        title: "PRODUCT REVIEWS",
        text: "Gear that performs. Honest reviews and expert insight to help you invest in the right equipment.",
        image: upload('/2024/06/Esports.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=196"
        }
      },
      {
        title: "STRENGTH & CONDITIONING",
        text: "Build the engine. Programs designed to increase power, prevent injury, and elevate your athletic performance.",
        image: upload('/2025/07/CLP-Photos-Strength-and-Conditioning-800x800-1.png'),
        cta: {
          label: "Learn More",
          href: "/strength-conditioning-esports/"
        }
      }
    ],
    facilities: {
      title: "FACILITIES & VENUES NEARBY FOR PLAYING",
      items: [
        {
          image: upload('/2024/04/Esports.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/balance-patch.png'),
          subtitle: "Balance Patch",
          title: "(BOSTON)",
          excerpt: "Balance Patch is where serious players compete—high-performance setups, a tournament-ready environment, and a community that shows up to win.",
          bio: "Balance Patch is Boston’s premier esports lounge, offering top-tier gaming setups, tournaments, and a vibrant community for competitive and casual gamers alike.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Mixer-sports.png'),
          subtitle: "Mixer eSports + Cafe",
          title: "(MALDEN)",
          excerpt: "Mixer blends esports and social—top-tier rigs, regular tournaments, and a café vibe that makes it easy to stay and play.",
          bio: "Mixer eSports + Cafe blends gaming and community, offering high-end setups, tournaments, and a social hub for casual and competitive gamers in Boston.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2024/04/Esports.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Gamer-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/R5kh"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/esports-facilties-nearby/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Esports-1-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/strategy-insights/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Esports-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/esports/esports-photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Esports-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "ESPORTS RESOURCES FAQ's",
      items: [
        {
          question: "What types of eSports experiences do you offer?",
          answer: "Esports experiences include tournaments, gaming clinics, coaching sessions, esports camps, and esports-themed events."
        },
        {
          question: "Are your esports experiences suitable for all skill levels?",
          answer: "We offer experiences for gamers at all skill levels, from beginners to experts. Through our eSports partners, you’ll have the chance to learn, practice, and compete with other eSports enthusiasts."
        },
        {
          question: "What ages are your eSports experiences suitable for?",
          answer: "Participants of all ages can participate in our esports experiences, including juniors, adults, and competitive gamers. Our age-appropriate activities and coaching ensure that all participants have an enjoyable and rewarding experience."
        },
        {
          question: "Do I need to bring my own gaming equipment?",
          answer: "While our facilities provide gaming equipment, like gaming PCs, consoles, and peripherals, participants may bring their own gaming gear in some cases. This includes gaming mice, keyboards, controllers, and headsets."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/resources/esports/"
      }
    }
  },
  {
    section: "resources",
    slug: "golfing",
    meta: {
      title: "Golf Strength Training for Players: Compete Like Pros™",
      description: "Stay fit with golf injury prevention programs. Learn expert techniques to protect your swing and enhance long-term performance."
    },
    hero: {
      title: [
        "Golfing",
        "Resources"
      ],
      backgroundImage: upload('/2024/03/1686927118383.jpg'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“Success in this game depends less on strength of body than strength of mind and character.”",
        author: "- ARNOLD PALMER"
      },
      {
        text: "“The value of routine; trusting your swing.”",
        author: "- LORII MYERS"
      },
      {
        text: "“Achievements on the golf course are not what matter; decency and honesty are what matter.”",
        author: "- TIGER WOODS"
      },
      {
        text: "“Keep your sense of humor. There’s enough stress in the rest of your life not to let bad shots ruin a game you’re supposed to enjoy.”",
        author: "- AMY ALCOTT"
      },
      {
        text: "The more I work and practice, the luckier I seem to get.”",
        author: "- GARY PLAYER"
      }
    ],
    features: [
      {
        title: "DIETING & NUTRITION",
        text: "Fuel your performance. Expert guidance on nutrition built to support how you train, recover, and compete.",
        image: upload('/2024/04/CLP-Photos-Dieting.png'),
        cta: {
          label: "Learn More",
          href: "/golfing-dieting-nutrition/"
        }
      },
      {
        title: "JOBS/INTERNSHIPS",
        text: "Build your career in sports. Explore jobs and internships with organizations that value talent and ambition.",
        image: upload('/2024/04/CLP-Photos-Jobs.png'),
        cta: {
          label: "Learn More",
          href: "https://jobs.competelikepros.com/"
        }
      },
      {
        title: "INJURY PREVENTION & RECOVERY",
        text: "Stay in the game. Resources and programs designed to keep your body moving, recovering, and performing at its best.",
        image: upload('/2024/04/CLP-Photos-Injury-Prevention-Recovery.png'),
        cta: {
          label: "Learn More",
          href: "/golfing-injury-prevention-rehab-nearby/"
        }
      },
      {
        title: "MENTAL HEALTH & RESILIENCE",
        text: "Train the mind like you train the body. Tools and support to build mental strength, focus, and resilience—on and off the field.",
        image: upload('/2024/04/Wellness.png'),
        cta: {
          label: "Learn More",
          href: "/golfing-mental-health-resilience/"
        }
      },
      {
        title: "PRODUCT REVIEWS",
        text: "Gear that performs. Honest reviews and expert insight to help you invest in the right equipment.",
        image: upload('/2024/06/Golf.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=198"
        }
      },
      {
        title: "STRENGTH & CONDITIONING",
        text: "Build the engine. Programs designed to increase power, prevent injury, and elevate your athletic performance.",
        image: upload('/2025/07/CLP-Photos-Strength-and-Conditioning-800x800-1.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=198"
        }
      }
    ],
    facilities: {
      title: "FACILITIES & CLUBS NEARBY",
      items: [
        {
          image: upload('/2024/04/Golfing-1.png'),
          subtitle: "Your Club",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2024/04/Partner-Large-Photo.png'),
          cta: {
            label: "Book Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Brookline-Golf-Course.png'),
          subtitle: "Robert T. Lynch Golf Course",
          title: "(BROOKLINE)",
          excerpt: "Lynch Golf Course delivers a legit test for every level—rolling fairways, solid conditions, and Brookline's understated prestige.",
          bio: "Robert T. Lynch Municipal Golf Course offers a scenic and challenging course, welcoming golfers of all levels for an enjoyable and competitive experience near Boston.",
          bioImage: upload('/2025/03/Golf-Putter.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/RF2U"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Gannon-Municipal-Golf.png'),
          subtitle: "Gannon Municipal Golf Course",
          title: "(LYNN, MA)",
          excerpt: "Gannon offers an honest round—scenic views, a challenging layout, and the kind of course that rewards good shots.",
          bio: "Gannon Municipal Golf Course offers a scenic, challenging layout, providing golfers of all levels a top-tier playing experience in a picturesque setting near Boston.",
          bioImage: upload('/2025/03/Golf-Putter.png'),
          cta: {
            label: "Play Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Red-Tail-Golf-Club.png'),
          subtitle: "Red Tail Golf Club",
          title: "(DEVENS, MA)",
          excerpt: "Red Tail is the real deal—pristine conditions, strategic design, and a setting that makes every tee shot feel like it matters.",
          bio: "Red Tail Golf Club offers a championship-caliber course with scenic fairways, challenging holes, and a premier golfing experience set in a beautiful natural landscape.",
          bioImage: upload('/2025/03/Golf-Putter.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/RF2U"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/golfing-facilities-nearby/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Golf-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/strategy-insights/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Golf-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/golfing/golfing-photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Golf-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "GOLFING RESOURCES FAQ's",
      items: [
        {
          question: "What types of golfing experiences do you offer?",
          answer: "Our golfing experiences include clinics, training sessions, tournaments, golfing getaways, and golf-themed trips to renowned courses and destinations."
        },
        {
          question: "Are your golfing experiences suitable for all skill levels?",
          answer: "Yes, our experiences are suitable for all levels of golfers. Each participant’s needs are met through personalized activities and coaching, ensuring that everyone has a rewarding experience."
        },
        {
          question: "What ages are your golfing experiences suitable for?",
          answer: "Participants of all ages are welcome to take part in our golfing experiences, from juniors to seniors. Our programs create an enjoyable and inclusive environment for all ages with age-appropriate instruction and activities."
        },
        {
          question: "Do I need to bring my own golf equipment?",
          answer: "While we provide basic golf equipment, such as clubs and balls, we recommend that players bring their own clubs, gloves, golf shoes, and appropriate attire to the course/experience."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/resources/golfing/"
      }
    }
  },
  {
    section: "resources",
    slug: "pickleball",
    meta: {
      title: "Pickleball Jobs & Opportunities: Compete Like Pros™",
      description: "Find pickleball facilities near me for training, lessons, and games. Perfect venues to play, improve, and connect with players."
    },
    hero: {
      title: [
        "Pickleball",
        "Resources"
      ],
      backgroundImage: upload('/2024/05/Pickleball-Lady-1.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "\"You play the ball. You don’t play the opponent. Be free in your head. Be free in your shots. Go for it.\"",
        author: "– RODGER FEDERER"
      },
      {
        text: "“Everything comes at a cost. Just what are you willing to pay for it?”",
        author: "– SERENA WILLIAMS"
      },
      {
        text: "“Tennis is not a gentle game. Psychologically, it is vicious.\"",
        author: "– RICHARD EVANS"
      },
      {
        text: "\"When you lose a couple of times, it makes you realize how difficult it is to win.\"",
        author: "- STEFFI GRAF"
      },
      {
        text: "“Success is a journey, not a destination. The doing is often more important than the outcome.”",
        author: "– ARTHUR ASHE"
      }
    ],
    features: [
      {
        title: "DIETING & NUTRITION",
        text: "Fuel your performance. Expert guidance on nutrition built to support how you train, recover, and compete.",
        image: upload('/2024/04/CLP-Photos-Dieting.png'),
        cta: {
          label: "Learn More",
          href: "/pickleball-dieting-nutrition/"
        }
      },
      {
        title: "JOBS/INTERNSHIPS",
        text: "Build your career in sports. Explore jobs and internships with organizations that value talent and ambition.",
        image: upload('/2024/04/CLP-Photos-Jobs.png'),
        cta: {
          label: "Learn More",
          href: "mailto:jobs@competelikepros.com"
        }
      },
      {
        title: "INJURY PREVENTION & RECOVERY",
        text: "Stay in the game. Resources and programs designed to keep your body moving, recovering, and performing at its best.",
        image: upload('/2024/04/CLP-Photos-Injury-Prevention-Recovery.png'),
        cta: {
          label: "Learn More",
          href: "/pickleball-injury-prevention-rehab-nearby/"
        }
      },
      {
        title: "MENTAL HEALTH & RESILIENCE",
        text: "Train the mind like you train the body. Tools and support to build mental strength, focus, and resilience—on and off the field.",
        image: upload('/2024/04/Wellness.png'),
        cta: {
          label: "Learn More",
          href: "/pickleball-mental-health-resilience"
        }
      },
      {
        title: "PRODUCT REVIEWS",
        text: "Gear that performs. Honest reviews and expert insight to help you invest in the right equipment.",
        image: upload('/2024/06/Pickleball.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=199"
        }
      },
      {
        title: "STRENGTH & CONDITIONING",
        text: "Build the engine. Programs designed to increase power, prevent injury, and elevate your athletic performance.",
        image: upload('/2025/07/CLP-Photos-Strength-and-Conditioning-800x800-1.png'),
        cta: {
          label: "Learn More",
          href: "/strength-conditioning-pickleball/"
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2024/05/Pickleball.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Kendel-SQ.png'),
          subtitle: "Rooftop Garden",
          title: "KENDALL SQUARE (CAMBRIDGE)",
          excerpt: "Play above it all. Kendall Square's rooftop courts deliver competition with city views you won't find anywhere else.",
          bio: "Kendall Square Roof Garden features rooftop pickleball courts, blending competitive play with breathtaking city views, creating a one-of-a-kind experience for players of all levels in Cambridge.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Lawn-on-d-1.png'),
          subtitle: "Lawn on D",
          title: "SOUTHIE (BOSTON)",
          excerpt: "Lawn on D brings the social energy—open courts, good vibes, and a scene that makes every game feel like an event.",
          bio: "Lawn on D offers a lively pickleball space, combining fun, competition, and social play in a vibrant outdoor setting with a dynamic atmosphere.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Ink-block.png'),
          subtitle: "Underground at Ink Block",
          title: "SOUTH END (BOSTON)",
          excerpt: "Tucked beneath the highways of the South End, Underground at Ink Block is pickleball with an edge—gritty, social, and always buzzing.",
          bio: "Underground at Ink Block offers urban pickleball courts, blending competition, fitness, and community vibes in a vibrant space beneath Boston’s elevated highways.",
          bioImage: upload('/2025/03/Pickleball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/kosM"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/pickleball-facilities-parks/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Pickleball-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/strategy-insights/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Pickleball-4-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/tennis-pickleball/tennis-pickleball-photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Pickleball-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "PICKLEBALL RESOURCES FAQ's",
      items: [
        {
          question: "What types of pickleball experiences do you offer?",
          answer: "Our pickleball experiences include clinics, training sessions, social play events, tournaments, and excursions themed around pickleball."
        },
        {
          question: "Are your pickleball experiences suitable for all skill levels?",
          answer: "Pickleball players of all skill levels are welcome at our experiences. Our program provides participants with opportunities for skill development, friendly matches, and competitive play tailored to their needs."
        },
        {
          question: "What ages are your pickleball experiences suitable for?",
          answer: "Participants of various ages can enjoy pickleball with us, including youth players, adults, and seniors. To ensure that all age groups have a rewarding and enjoyable experience, we offer age-appropriate activities and coaching."
        },
        {
          question: "Do I need to bring my own pickleball equipment?",
          answer: "While we provide pickleball equipment at our experiences, such as paddles, balls, and nets, participants are welcome to bring their own equipment. In this category, you will find pickleball shoes, apparel, and accessories."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/resources/pickleball/"
      }
    }
  },
  {
    section: "resources",
    slug: "baseball-softball",
    meta: {
      title: "Baseball Facilities Near Me: Compete Like Pros™",
      description: "Improve your game with baseball strength training. Build power, stamina, and resilience with expert-designed athlete programs."
    },
    hero: {
      title: [
        "Baseball & Softball",
        "Resources"
      ],
      backgroundImage: upload('/2024/03/tt.jpg'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“Baseball is ninety percent mental. The other half is physical.”",
        author: "– YOGI BERRA"
      },
      {
        text: "“Never limit yourself, never be satisfied, and smile—it’s free!”",
        author: "– JENNIE FINCH"
      },
      {
        text: "“There may be people that have more talent than you, but there’s no excuse for anyone to work harder than you do.”",
        author: "– DEREK JETER"
      },
      {
        text: "“You owe it to yourself to be the best you can possibly be – in baseball and in life.”",
        author: "- PETE ROSE"
      },
      {
        text: "\"Never allow the fear of striking out keep you from playing the game.\"",
        author: "- BABE RUTH"
      },
      {
        text: "\"Statistics are like bikinis—they show a lot but not everything.\"",
        author: "- LOU PINIELLA"
      }
    ],
    features: [
      {
        title: "DIETING & NUTRITION",
        text: "Fuel your performance. Expert guidance on nutrition built to support how you train, recover, and compete.",
        image: upload('/2024/04/CLP-Photos-Dieting.png'),
        cta: {
          label: "Learn More",
          href: "/baseball-softball-dieting-nutrition/"
        }
      },
      {
        title: "JOBS/INTERNSHIPS",
        text: "Build your career in sports. Explore jobs and internships with organizations that value talent and ambition.",
        image: upload('/2024/04/CLP-Photos-Jobs.png'),
        cta: {
          label: "Learn More",
          href: "mailto:jobs@competelikepros.com"
        }
      },
      {
        title: "INJURY PREVENTION & RECOVERY",
        text: "Stay in the game. Resources and programs designed to keep your body moving, recovering, and performing at its best.",
        image: upload('/2024/04/CLP-Photos-Injury-Prevention-Recovery.png'),
        cta: {
          label: "Learn More",
          href: "/injury-prevention-rehab-nearby/"
        }
      },
      {
        title: "MENTAL HEALTH & RESILIENCE",
        text: "Train the mind like you train the body. Tools and support to build mental strength, focus, and resilience—on and off the field.",
        image: upload('/2024/04/Wellness.png'),
        cta: {
          label: "Learn More",
          href: "/baseball-softball-mental-health-resilience/"
        }
      },
      {
        title: "PRODUCT REVIEWS",
        text: "Gear that performs. Honest reviews and expert insight to help you invest in the right equipment.",
        image: upload('/2024/06/Baseball.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=194"
        }
      },
      {
        title: "STRENGTH & CONDITIONING",
        text: "Build the engine. Programs designed to increase power, prevent injury, and elevate your athletic performance.",
        image: upload('/2025/07/CLP-Photos-Strength-and-Conditioning-800x800-1.png'),
        cta: {
          label: "Learn More",
          href: "/strength-conditioning-baseball-softball-2/"
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2025/04/Baseball.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2024/04/Partner-Large-Photo.png'),
          cta: {
            label: "Book Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Back-bay-clemente.png'),
          subtitle: "Clemente Field",
          title: "BACK BAY - FENWAY (BOSTON)",
          excerpt: "Clemente Field sits in the heart of the Fens—Boston's original green space. Train where generations of ballplayers have sharpened their game.",
          bio: "Back Bay Fens baseball field offers a historic and well-maintained space where athletes and teams can train, compete, and enjoy the game in Boston.",
          bioImage: upload('/2025/03/Baseball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/wLeN"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Memorial-park.png'),
          subtitle: "Memorial Park",
          title: "EASTIE (BOSTON)",
          excerpt: "Memorial Park is the heartbeat of East Boston baseball—a neighborhood diamond built for competition, connection, and community pride.",
          bio: "East Boston Memorial Park features well-maintained baseball fields, providing athletes and teams a premier space for games, training, and community play in Boston.",
          bioImage: upload('/2025/03/Baseball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/wLeN"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Langone-Park.png'),
          subtitle: "Langone Park",
          title: "NORTH END (BOSTON)",
          excerpt: "Play with the harbor at your back. Langone Park delivers one of Boston's most iconic settings—where the North End's legendary energy meets the field.",
          bio: "Langone Park features scenic waterfront baseball fields, offering athletes and teams a premier space for games, training, and community engagement in Boston.",
          bioImage: upload('/2025/03/Baseball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/wLeN"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/book-a-session/baseball-experience/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Baseball-Content-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/strategy-insights/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Baseball-Content-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/baseball/photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Baseball-Content-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "BASEBALL & SOFTBALL RESOURCES FAQ's",
      items: [
        {
          question: "What types of baseball experiences do you offer?",
          answer: "Training camps, skills clinics, coaching sessions, friendly games, tournaments, and baseball-themed trips to iconic stadiums and cities are just some of the baseball experiences we offer."
        },
        {
          question: "Are your baseball experiences suitable for all skill levels?",
          answer: "We offer experiences for players of all skill levels, from beginners to advanced. To ensure a rewarding experience for everyone, we tailor our sessions and activities to suit different skill levels."
        },
        {
          question: "What ages are your baseball experiences suitable for?",
          answer: "Baseball experiences are tailored to participants of all ages, including youth players, adults, and families. The activities and coaching we offer are age-appropriate to ensure that all age groups have a positive and enjoyable experience."
        },
        {
          question: "Do I need to bring my own baseball gear?",
          answer: "We provide some basic equipment, such as baseballs and bats, but we recommend that participants bring their own equipment, including gloves, cleats, helmets, and appropriate attire."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/resources/baseball/"
      }
    }
  },
  {
    section: "resources",
    slug: "basketball",
    meta: {
      title: "Basketball Nutrition Diet Guide: Compete Like Pros™",
      description: "Unlock potential with basketball strength training. Tailored workouts for agility, endurance, and explosive performance."
    },
    hero: {
      title: [
        "Basketball",
        "Resources"
      ],
      backgroundImage: upload('/2024/04/Basketball-main.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“ You can practice shooting eight hours a day, but if your technique is wrong, then all you become is very good at shooting the wrong way. Get the fundamentals down and the level of everything you do will rise.”",
        author: "- MICHAEL JORDAN"
      },
      {
        text: "“As an athlete, as long as you’re being authentic to who you are, then I don’t think you can do any wrong with sports off the court, on the court.”",
        author: "– CANDACE PARKER"
      },
      {
        text: "“Ask not what your teammates can do for you. Ask what you can do for your teammates.”",
        author: "- MAGIC JOHNSON"
      },
      {
        text: "“ Basketball is like war in that offensive weapons are developed first, and it always takes a while for the defense to catch up.”",
        author: "- RED AUERBACH"
      },
      {
        text: "“Everything negative — pressure, challenges — are all an opportunity for me to rise.”",
        author: "- KOBE BRYANT"
      },
      {
        text: "“ I have all the confidence in the world in this group, and they believe right back in me.”",
        author: "- CAITLIN CLARK"
      },
      {
        text: "“ Do your best when no one is looking. If you do that, then you can be successful at anything you put your mind to.”",
        author: "- BOB COUSY"
      },
      {
        text: "“ Basketball isn’t just a sport. It is an art, one that must be mastered to succeed.”",
        author: "- STEPH CURRY"
      }
    ],
    features: [
      {
        title: "DIETING & NUTRITION",
        text: "Fuel your performance. Expert guidance on nutrition built to support how you train, recover, and compete.",
        image: upload('/2024/04/CLP-Photos-Dieting.png'),
        cta: {
          label: "Learn More",
          href: "/basketball-dieting-nutrition/"
        }
      },
      {
        title: "JOBS/INTERNSHIPS",
        text: "Build your career in sports. Explore jobs and internships with organizations that value talent and ambition.",
        image: upload('/2024/04/CLP-Photos-Jobs.png'),
        cta: {
          label: "Learn More",
          href: "mailto:jobs@competelikepros.com"
        }
      },
      {
        title: "INJURY PREVENTION & RECOVERY",
        text: "Stay in the game. Resources and programs designed to keep your body moving, recovering, and performing at its best.",
        image: upload('/2024/04/CLP-Photos-Injury-Prevention-Recovery.png'),
        cta: {
          label: "Learn More",
          href: "/basketball-injury-prevention-rehab-nearby/"
        }
      },
      {
        title: "MENTAL HEALTH & RESILIENCE",
        text: "Train the mind like you train the body. Tools and support to build mental strength, focus, and resilience—on and off the field.",
        image: upload('/2024/04/Wellness.png'),
        cta: {
          label: "Learn More",
          href: "/basketball-mental-health-resilience/"
        }
      },
      {
        title: "PRODUCT REVIEWS",
        text: "Gear that performs. Honest reviews and expert insight to help you invest in the right equipment.",
        image: upload('/2024/06/basketball.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=195"
        }
      },
      {
        title: "STRENGTH & CONDITIONING",
        text: "Build the engine. Programs designed to increase power, prevent injury, and elevate your athletic performance.",
        image: upload('/2025/07/CLP-Photos-Strength-and-Conditioning-800x800-1.png'),
        cta: {
          label: "Learn More",
          href: "/strength-conditioning-basketball"
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2025/07/Basketball-1.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2024/04/Partner-Large-Photo.png'),
          cta: {
            label: "Book Now",
            href: ""
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Lopresti-bball.png'),
          subtitle: "LoPresti Park",
          title: "EASTIE (BOSTON)",
          excerpt: "LoPresti brings waterfront basketball to Eastie—scenic courts with competitive runs and community pride.",
          bio: "LoPresti Park provides top-tier waterfront basketball courts, creating an energetic environment for players to compete, practice, and connect while enjoying stunning Boston Harbor views.",
          bioImage: upload('/2025/03/Basketball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/9t4N"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/back-bay-fen-basketball.png'),
          subtitle: "Clemente Courts",
          title: "BACK BAY - FENWAY (BOSTON)",
          excerpt: "Clemente Courts sits in the heart of Back Bay Fens—an outdoor hoops staple where players of all levels come to compete.",
          bio: "Back Bay Fens provides outdoor basketball courts, inviting athletes of all levels to play, practice, and engage in competitive games within a vibrant park atmosphere.",
          bioImage: upload('/2025/03/Basketball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/9t4N"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Smith-Playground-bball.png'),
          subtitle: "Smith Playground",
          title: "ALLSTON (BOSTON)",
          excerpt: "Smith Playground is the neighborhood's go-to—quality courts, good runs, and a community that shows up ready to play.",
          bio: "Smith Playground offers top-tier basketball courts, welcoming players of all levels to train, compete, and connect in an energetic community-driven sports environment in Boston.",
          bioImage: upload('/2025/03/Basketball-Large.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/9t4N"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/basketball-facilities-parks/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "Articles",
          image: upload('/2024/04/Basketball-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/strategy-insights/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Basketball-content-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/basketball-2/photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Basketball-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "BASKETBALL RESOURCES FAQ's",
      items: [
        {
          question: "What types of basketball experiences do you offer?",
          answer: "We offer a variety of basketball experiences, including skills clinics, training camps, coaching sessions, pick-up games, tournaments, and basketball-themed trips to iconic courts and cities."
        },
        {
          question: "Are your basketball experiences suitable for all skill levels?",
          answer: "Players of all skill levels are welcome to participate in our experiences. Regardless of skill level, our activities and sessions are tailored to suit everyone’s needs."
        },
        {
          question: "What ages are your basketball experiences suitable for?",
          answer: "Basketball experiences are designed for players of all ages, including youth players, adults, and families. Age-appropriate activities and coaching ensure a positive and enjoyable experience for all ages."
        },
        {
          question: "Do I need to bring my own basketball gear?",
          answer: "Although we provide some basic equipment, such as balls and cones, we recommend that participants bring their own basketball gear, such as shoes, shorts, shirts, and appropriate attire for training and games."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/resources/basketball/"
      }
    }
  },
  {
    section: "resources",
    slug: "futbolsoccer",
    meta: {
      title: "Soccer Strength Training Guide: Compete Like Pros™",
      description: "Improve performance with soccer nutrition tips. Tailored diet plans that boost stamina, agility, and recovery for players."
    },
    hero: {
      title: [
        "Fútbol(Soccer)",
        "Resources"
      ],
      backgroundImage: upload('/2024/04/Futbol.png'),
      backgroundColor: "#0a0a0a"
    },
    quotes: [
      {
        text: "“The more difficult the victory, the greater the happiness in winning.”",
        author: "– PELÉ"
      },
      {
        text: "“I always try to be the best, but I want to do it playing well and with humility.”",
        author: "– LIONEL MESSI"
      },
      {
        text: "“The vision of a champion is someone who is bent over, drenched in sweat, at the point of exhaustion when no one else is watching.”",
        author: "– MIA HAMM"
      },
      {
        text: "“I once cried because I had no shoes to play soccer, but one day, I met a man who had no feet.”",
        author: "– ZINEDINE ZIDANE"
      },
      {
        text: "“Good soccer players need not only great footwork but also a big heart.”",
        author: "– ABBY WAMBACH"
      },
      {
        text: "“Talent is important, but it’s the effort that determines the level of your success.”",
        author: "– CRISTIANO RONALDO"
      },
      {
        text: "“When people succeed, it is because of hard work. Luck has nothing to do with success.”",
        author: "– DIEGO MARANDONA"
      }
    ],
    features: [
      {
        title: "DIETING & NUTRITION",
        text: "Fuel your performance. Expert guidance on nutrition built to support how you train, recover, and compete.",
        image: upload('/2024/04/CLP-Photos-Dieting.png'),
        cta: {
          label: "Learn More",
          href: "/futbol-dieting-nutrition/"
        }
      },
      {
        title: "JOBS/INTERNSHIPS",
        text: "Build your career in sports. Explore jobs and internships with organizations that value talent and ambition.",
        image: upload('/2024/04/CLP-Photos-Jobs.png'),
        cta: {
          label: "Learn More",
          href: "https://jobs.competelikepros.com/"
        }
      },
      {
        title: "INJURY PREVENTION & RECOVERY",
        text: "Stay in the game. Resources and programs designed to keep your body moving, recovering, and performing at its best.",
        image: upload('/2024/04/CLP-Photos-Injury-Prevention-Recovery.png'),
        cta: {
          label: "Learn More",
          href: "/soccer-injury-prevention-rehab-nearby/"
        }
      },
      {
        title: "MENTAL HEALTH & RESILIENCE",
        text: "Train the mind like you train the body. Tools and support to build mental strength, focus, and resilience—on and off the field.",
        image: upload('/2024/04/Wellness.png'),
        cta: {
          label: "Learn More",
          href: "/futbol-mental-health-resilience/"
        }
      },
      {
        title: "PRODUCT REVIEWS",
        text: "Gear that performs. Honest reviews and expert insight to help you invest in the right equipment.",
        image: upload('/2024/06/Futbol.png'),
        cta: {
          label: "Learn More",
          href: "/product-reviews/?filter=197"
        }
      },
      {
        title: "STRENGTH & CONDITIONING",
        text: "Build the engine. Programs designed to increase power, prevent injury, and elevate your athletic performance.",
        image: upload('/2025/07/CLP-Photos-Strength-and-Conditioning-800x800-1.png'),
        cta: {
          label: "Learn More",
          href: "/strength-conditioning-futbol-soccer/"
        }
      }
    ],
    facilities: {
      title: "FACILITIES & PARKS NEARBY",
      items: [
        {
          image: upload('/2025/03/soccer-large-917x1024.png'),
          subtitle: "Your Facility",
          title: "SHOULD BE HERE",
          excerpt: "With our support, clients learn new skills, build strong bonds, and take calculated risks to grow. Together, we are purposeful in our pursuit of excellence.",
          bio: "CLP provides sports, fitness, and entertainment expertise to athletes, brands, coaches, fans, influencers, parents, and teams globally.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Learn Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Back-Bay-Fens-small.png'),
          subtitle: "Clemente Field",
          title: "BACK BAY -FENWAY (BOSTON)",
          excerpt: "Clemente Field sits at the heart of the Fens—open turf, an iconic setting, and space to train the way you play.",
          bio: "Clemente Field offers an open turf field, inviting athletes and teams to play, train, and enjoy the game in a scenic setting.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Lopresti-small-1.png'),
          subtitle: "LoPresti Park",
          title: "EASTIE (BOSTON)",
          excerpt: "LoPresti brings the harbor views and Eastie's competitive spirit together on one of Boston's best waterfront pitches.",
          bio: "LoPresti Park offers stunning waterfront soccer fields, creating an energetic environment for athletes, teams, and fans to train, compete, and enjoy the game in East Boston.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        },
        {
          image: upload('/2025/03/Carter-Playground-Full-917x1024.png'),
          subtitle: "Carter Playground",
          title: "SOUTH END (BOSTON)",
          excerpt: "Carter Playground is a neighborhood hub—quality turf, strong community, and the kind of energy that makes you want to compete.",
          bio: "Carter Playground features high-quality soccer fields, offering athletes, teams, and fans a premier space for training, competition, and community engagement in Boston.",
          bioImage: upload('/2025/03/Soccer-Guy.png'),
          cta: {
            label: "Play Now",
            href: "https://link.heylo.co/TH7A"
          },
          socials: [
            {
              network: "linkedin",
              href: ""
            },
            {
              network: "instagram",
              href: ""
            },
            {
              network: "facebook",
              href: ""
            },
            {
              network: "youtube",
              href: ""
            }
          ]
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "/futbolsoccer-facilties-nearby/"
      }
    },
    updates: {
      title: "UPDATES AND NEWS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/04/Soccer-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/strategy-insights/",
          newTab: true
        },
        {
          title: "Photos",
          image: upload('/2024/04/Soccer-1-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/experiences/futbol/futbol-soccer-photos/",
          newTab: true
        },
        {
          title: "Videos",
          image: upload('/2024/04/Soccer-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "FÚTBOL (SOCCER)\nRESOURCES FAQ's",
      items: [
        {
          question: "What types of soccer experiences do you offer?",
          answer: "As a soccer experience provider, we offer a variety of soccer-related activities, such as training camps, coaching clinics, friendly matches, tournaments, and trips to iconic soccer stadiums."
        },
        {
          question: "Are your soccer experiences suitable for all skill levels?",
          answer: "We offer experiences for players of all skill levels, from beginners to advanced. Sessions and activities are tailored to accommodate different skill levels and ensure that everyone has a rewarding experience."
        },
        {
          question: "What ages are your soccer experiences suitable for?",
          answer: "Our soccer experiences are designed for participants of various ages, including youth players, adults, and even families. We offer age-appropriate activities and coaching to ensure a positive and enjoyable experience for all age groups."
        },
        {
          question: "Do I need to bring my own soccer gear?",
          answer: "Participants should bring their own soccer gear, including cleats, shin guards, and appropriate attire for training or matches. We provide some basic equipment, such as balls and cones."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/resources/futbol/"
      }
    }
  }
];

export const getSportPage = (section: SportPage['section'], slug: string) =>
  sportPages.find((p) => p.section === section && p.slug === slug);
