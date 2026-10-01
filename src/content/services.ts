// Content for the service pages (/brand-product-development/ etc.), extracted from the original site.
import type { ServicePage } from './types';
import { upload } from './site';

export const servicePages: ServicePage[] = [
  {
    slug: "brand-product-development",
    meta: {
      title: "Sports Brand Marketing & Strategy Experts",
      description: "Unlock growth with expert brand strategy services. We help athletes and sports companies build strong identities and market presence."
    },
    hero: {
      title: [
        "Brand & Product",
        "Development Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "Strategies For Sustaining Market Success, Innovation, And Customer Engagement",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "We guide you from concept to market with our brand & product development services. With our strategic planning, innovative design, and effective marketing, we will ensure that your brand and products thrive. By leveraging our expertise, we turn your ideas into successful, market-ready products."
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Brand.png'),
          subtitle: "BRANDING",
          title: "Services",
          excerpt: "",
          bio: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.",
          cta: {
            label: "Start A Project",
            href: "/brand-product-development/inquiry/"
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
          image: upload('/2024/05/Sales.png'),
          subtitle: "Marketing + Sales",
          title: "Services",
          excerpt: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.",
          bio: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.",
          cta: {
            label: "Start A Project",
            href: "/brand-product-development/inquiry/"
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
          image: upload('/2024/05/Product.png'),
          subtitle: "PRODUCT",
          title: "Development",
          excerpt: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.",
          bio: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.",
          cta: {
            label: "Start A Project",
            href: "/brand-product-development/inquiry/"
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
          image: upload('/2024/05/Web.png'),
          subtitle: "WEBSITE DESIGN +",
          title: "Development",
          excerpt: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.",
          bio: "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.",
          cta: {
            label: "Start A Project",
            href: "/brand-product-development/inquiry/"
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
        label: "VIEW MORE",
        href: "/services/brand-product-development/"
      }
    },
    recent: {
      title: "OUR RECENT PROJECTS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Light-Buld-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/brand-product-development/articles/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Shoes-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/brand-product-development/photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Training-Girls-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      italic: true,
      title: "BRAND & PRODUCT DEVELOPEMENT FAQ's",
      items: [
        {
          question: "What services do you offer for brand development?",
          answer: "Our brand development services include brand strategy, brand identity design, brand messaging, brand positioning, and brand experience design."
        },
        {
          question: "Can you help with defining brand values and mission?",
          answer: "Creating a strong brand identity starts with defining your brand’s core values, mission statement, vision, and unique selling proposition."
        },
        {
          question: "Can you assist with product branding and packaging design?",
          answer: "For enhanced product appeal and marketability, we provide product branding, packaging design, labeling, messaging, and visual merchandising services."
        },
        {
          question: "Do you conduct market research and competitive analysis for product development?",
          answer: "As part of our product development strategy, we conduct market research, competitive analysis, consumer insights, trend analysis, and market segmentation."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/our-services/brand-product-development/"
      }
    }
  },
  {
    slug: "content-creation-licensing",
    meta: {
      title: "Professional Sports Photography Services",
      description: "Work with a video production services company that specializes in sports highlights, creative reels, and professional content creation."
    },
    hero: {
      title: [
        "Content Creation /",
        "Licensing Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "Content Creation And Licensing Are Essential Aspects Of Building A Strong Brand Presence, Ensuring Originality, And Maintaining Legal Compliance.",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "To enhance your brand, we can help you create and license content. Our services include producing compelling, high-quality content tailored to your needs, as well as securing all rights. Brands need content that drives engagement, builds loyalty, and elevates their presence.",
      italic: true
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Copywriting.png'),
          subtitle: "COPYWRITING",
          title: "Services",
          excerpt: "Our copywriting services create powerful messages that engage your audience and drive action.",
          bio: "We create captivating, persuasive content tailored to your brand’s voice, making sure every message resonates with your target audience, drives engagement, and inspires action, enhancing your marketing effectiveness and achieving your business goals.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/content-creation-licensing/inquiry/"
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
          image: upload('/2024/05/Graphic-Design.png'),
          subtitle: "GRAPHIC DESIGN",
          title: "Services",
          excerpt: "Your brand will stand out with stunning graphics designed to grab your audience's attention. In crowded markets, your visual identity should stand out.",
          bio: "With creativity and precision, our graphic design services bring your brand vision to life. From logos to marketing materials, we create designs that engage your target audience. Using both artistry and strategic thinking, our designers deliver designs that look stunning and align with your brand’s goals. No matter what your branding needs are, we can elevate your visual identity and help you make a lasting impression in today’s competitive environment.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/content-creation-licensing/inquiry/"
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
          image: upload('/2024/05/Weights.png'),
          subtitle: "PHOTOGRAPHY",
          title: "Services",
          excerpt: "Photography captures moments, emotions, and stories, bringing life to your memories. With an eye for detail and a passion for storytelling, we deliver visuals that resonate with your audience and leave a lasting impression.",
          bio: "Our photography services go beyond just clicking pictures; we tell stories through every frame. Each project is approached with creativity and precision, whether it is capturing the love and laughter of a wedding, the excitement of a corporate event, or the essence of a product.\n\nOur team of experienced photographers understands the power of images to convey messages, emotions, and stories. Every shot we take is captured using advanced equipment and techniques.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/content-creation-licensing/inquiry/"
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
          image: upload('/2024/05/Video.png'),
          subtitle: "VIDEO PHOTOGRAPHY",
          title: "Services",
          excerpt: "Our video production services elevate your message and engage your audience through captivating visuals. To produce compelling videos that leave a lasting impression, we combine creativity and expertise.",
          bio: "We offer more than just video production services; we are storytellers who weave narratives through moving images. The production of corporate videos, promotional campaigns, or creative projects is what we do best.\n\nWith cutting-edge technology and innovative techniques, our talented videographers and editors deliver high-quality videos that resonate with viewers. Each aspect of your video will be meticulously crafted to convey your message effectively, from scripting and storyboarding to filming and post-production.",
          cta: {
            label: "Start a Project",
            href: "/content-creation-licensing/inquiry/"
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
        label: "VIEW MORE",
        href: "/services/content-creation-licensing-services/"
      }
    },
    recent: {
      title: "OUR RECENT PROJECTS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Training-Guy-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/content-creation-licensing/articles/"
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Camera-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/content-creation-licensing/photos/"
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Kids-Playing-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros"
        }
      ]
    },
    faq: {
      italic: true,
      title: "CONTENT CREATION / LICENSING FAQ's",
      items: [
        {
          question: "What content creation services do you offer?",
          answer: "Copywriting, graphic design, video production, photography, social media content, and blog/article writing are all services we provide."
        },
        {
          question: "Do you specialize in specific types of content creation?",
          answer: "There are many types of content that we can create, including promotional materials, marketing collateral, brand storytelling, educational content, and multimedia presentations."
        },
        {
          question: "What licensing services do you offer?",
          answer: "Our licensing services include image licensing, video licensing, and intellectual property management."
        },
        {
          question: "How can I engage your content creation and licensing services for my organization?",
          answer: "To engage our content creation and licensing services, please use our website, email, or phone number. We will work with you to understand your content needs, create compelling content, ensure legal compliance, and maximize the impact of your content strategy."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/our-services/content-creation-licensing/"
      }
    }
  },
  {
    slug: "event-project-management",
    meta: {
      title: "Event / Project Management - Compete Like Pros™",
      description: "With our event and project management services, you can optimize the success of your event or project. From idea to execution, we will coordinate your event"
    },
    hero: {
      title: [
        "Event / Project",
        "Management Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "Ensure Timely Executions, Maximize Resource Utilization, And Deliver Outcomes That Exceed Expectations.",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "With our event and project management services, you can optimize the success of your event or project. From idea to execution, we will coordinate your event flawlessly and creatively. We are committed to exceeding your expectations and fulfilling your vision."
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Budget.png'),
          subtitle: "Budget Planning /",
          title: "Management",
          excerpt: "Making every dollar count is important to us. Therefore, we are always looking for income sources to save you money on your project.",
          bio: "Use technology and the supply chain to reduce costs and protect the environment. Using innovative and proven experiential marketing approaches, our team can handle all budget related aspects and report directly to key stakeholders. Maintain budgets and on-time performance with all vendors.",
          cta: {
            label: "Start a Project",
            href: "/event-project-management/inquiry/"
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
          image: upload('/2024/05/Event.png'),
          subtitle: "Event",
          title: "Management",
          excerpt: "Content creation, utilizing various channels like social media, email, and press releases, is essential to promoting the event, engaging attendees, and improving the overall experience.",
          bio: "Communication for events is a multifaceted process that involves the development, coordination, and implementation of communication strategies. Among these events are corporate conferences and trade shows, as well as community gatherings, workshops, and product launches.",
          cta: {
            label: "Start a Project",
            href: "/event-project-management/inquiry/"
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
          image: upload('/2024/05/Hotel.png'),
          subtitle: "Housing Selection /",
          title: "Management",
          excerpt: "As part of the housing selection and management process, suitable accommodations will be selected, as well as their maintenance and operation during project implementation.",
          bio: "All activities related to acquiring, maintaining, and overseeing accommodations are included in housing selection and management. It is essential to ensure that guests have access to safe, comfortable, and well-maintained housing.",
          cta: {
            label: "Start a Project",
            href: "/event-project-management/inquiry/"
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
          image: upload('/2024/03/c.jpg'),
          subtitle: "Sponsor",
          title: "Coordination",
          excerpt: "Sponsor coordination involves identifying and negotiating sponsorship agreements, ensuring sponsor benefits are fulfilled, and managing relationships with sponsors.",
          bio: "Managing sponsorship partnerships involves cultivating and managing financial and in-kind contributions from sponsors in order to support events, initiatives, and projects. As a result of this process, sponsors and sponsored entities can secure resources and enhance brand visibility, as well as achieve mutual objectives.",
          cta: {
            label: "Start a Project",
            href: "/event-project-management/inquiry/"
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
        label: "VIEW MORE",
        href: "/services/event-project-management-services/"
      }
    },
    recent: {
      title: "OUR RECENT PROJECTS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Hands-1-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/category/event-project-management/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Color-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/event-project-management/photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Seating-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      title: "EVENT / PROJECT MANAGEMENT FAQ's",
      items: [
        {
          question: "What event management services do you offer?",
          answer: "Our event management services include event planning, logistics coordination, vendor management, budgeting, marketing, and on-site execution."
        },
        {
          question: "What types of events do you specialize in managing?",
          answer: "Corporate events, conferences, trade shows, product launches, gala dinners, weddings, and community events are among the types of events we manage."
        },
        {
          question: "Can you assist with venue selection and negotiation?",
          answer: "As part of our venue selection and negotiation services, we ensure that the chosen venue meets the event’s objectives, budget, and logistical requirements."
        },
        {
          question: "What project management services do you offer?",
          answer: "Our project management services include event planning, marketing campaigns, product launches, and organizational initiatives."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/event-project-management/"
      }
    }
  },
  {
    slug: "fundraising-retailing",
    meta: {
      title: "Best Fundraisers for Sports Teams: Compete Like Pros™",
      description: "Boost your team’s budget with effective sports fundraising ideas. Creative campaigns and proven strategies to support athletes and clubs."
    },
    hero: {
      title: [
        "Fundraising/Retailing",
        "Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "In The World Of Fundraising And Retail, We Specialize In Both. You Can Count On Us For Results, Whether You Need To Make Your Retail Operations Work Better Or Raise Funds.",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "Our fundraising and retailing solutions can help you make a bigger impact. In order to increase donations and sales, we use proven techniques and innovative approaches. Our comprehensive, results-driven services will help you increase your reach, engage your audience, and maximize your profits."
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Direct-Mail.png'),
          subtitle: "Direct Mailing",
          title: "Campaigns",
          excerpt: "In direct marketing, prospects are viewed through a statistical lens, and fundraising considers them as individuals with varying needs; Research suggests that interests influence values and preferences.",
          bio: "A direct mail campaign involves a top-level executive writing a letter to a prospect, donor, or member of the organization. This method of fundraising is much more effective than email fundraising. Donors receive a more personal touch when they receive direct mail, and they can make donations easily through online fundraising. Communication via direct mail should closely follow communication via the internet and e-mail.",
          cta: {
            label: "Star a Project",
            href: "/fundraising-retailing/inquiry/"
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
          image: upload('/2024/05/Fundraiser.png'),
          subtitle: "Earned Income",
          title: "Campaigns",
          excerpt: "Using virtual or in-person fundraising, your organization can host events and sell products for fundraising.",
          bio: "Income earned from the sale of goods or services, or from work performed, is known as earned income. Earned income is becoming increasingly popular among nonprofits. Due to factors such as increased competition and a flagging economy, organizations now need to implement revenue-earning programs in order to stay afloat. To meet long-term sustainability and growth needs, organizations should diversify or expand their support bases.",
          cta: {
            label: "Star a Project",
            href: "/fundraising-retailing/inquiry/"
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
          image: upload('/2024/05/Popup-Shop.png'),
          subtitle: "Popup Shop",
          title: "Campaigns",
          excerpt: "Designed to create a sense of urgency and excitement, these are temporary retail spaces. They feature unique products, collaborations, or experiences that cannot be found anywhere else.",
          bio: "Pop-up shops, also known as pop-up stores or flash retailing, are temporary retail spaces that operate for a limited time, typically a few days to a few weeks. They take advantage of fleeting trends, seasonal trends, or special events. There are a variety of holiday markets, Halloween stores, and limited-time experiential retail concepts to choose from.",
          cta: {
            label: "Star a Project",
            href: "/fundraising-retailing/inquiry/"
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
          image: upload('/2024/05/Social-Media.png'),
          subtitle: "Social Media",
          title: "Campaigns",
          excerpt: "facilitates online fundraising, such as crowdfunding and peer-to-peer campaigns.",
          bio: "A crucial aspect of strong social media campaigns involves enlisting active support from as many existing and prospective donors as possible. Encourage your current supporters to spread the word about your organization’s purpose on your behalf. Their personal networks offer great potential for spreading your nonprofit’s reach even further.",
          cta: {
            label: "Star a Project",
            href: "/fundraising-retailing/inquiry/"
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
        label: "VIEW MORE",
        href: "/services/fundraising-retailing-services/"
      }
    },
    recent: {
      title: "OUR RECENT PROJECTS",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Community-1-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/fundraising-retailing/articles/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Retail-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/fundraising-retailing/photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Volunteers-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      italic: true,
      title: "FUNDRAISING/RETAILING FAQ's",
      items: [
        {
          question: "What fundraising services do you offer?",
          answer: "Our fundraising services include campaign planning and management, donor outreach and engagement, grant writing, event fundraising, and donor stewardship."
        },
        {
          question: "What retailing services do you offer?",
          answer: "Our retailing services include sourcing and procurement of products, inventory management, pricing strategies, merchandising, and sales optimization."
        },
        {
          question: "Do you assist with setting up and managing online retail platforms?",
          answer: "We can assist you in setting up and managing online retail platforms, including e-commerce websites, digital marketing, order fulfillment, and customer experience optimization."
        },
        {
          question: "How can I engage your fundraising and retailing services for my organization?",
          answer: "If you are interested in our fundraising or retailing services, please contact us through our website, email, or phone. We will work with you to understand your needs, develop customized solutions, and support your fundraising and retailing efforts."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/our-services/fundraising-retailing/"
      }
    }
  },
  {
    slug: "recovery-performance-training",
    meta: {
      title: "Sports Nutrition Counseling for Athletes: Compete Like Pros™",
      description: "Enhance skills with elite performance coaching. Personalized training programs designed to improve strength, recovery, and mental toughness."
    },
    hero: {
      title: [
        "Nutrition/Performance",
        "Programming Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "We Are Committed To Helping You Achieve Success In Training And Recovery. Advanced Training Methods And Recovery Strategies Will Enhance Your Performance, Letting You Reach New Levels.",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "With our nutrition & performance programming, you can maximize your athletic potential. To create tailored programs, we combine cutting-edge recovery techniques with performance-enhancing exercises. You can maximize results, prevent injuries, and stay at the top of your game with expert guidance. With our specialized training solutions, you will be able to take your game to a whole new level.",
      italic: true
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Nutrition-1.png'),
          subtitle: "NUTRITION",
          title: "Counseling",
          excerpt: "We offer nutrition counseling to help you make the most of your physical activities and wellness journey. Nutritionists provide personalized dietary plans to enhance performance and recovery, ensuring you remain energized and at your best.",
          bio: "Improve your physical activity and wellness journey with our nutrition counseling services. Personalized dietary plans tailored to your unique needs enhance your performance and recovery. Our guidance ensures that you stay energized and in top condition no matter what you’re doing, from preparing for a big game to exploring a new city. To help you make the best food choices while traveling, we offer meal planning, nutritional assessments, and ongoing support.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/recovery-performance-training/inquiry/"
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
          image: upload('/2024/05/Testing.png'),
          subtitle: "PERFORMANCE",
          title: "Testing",
          excerpt: "Boost your athletic performance with our performance testing services. Assess your strengths, improve your weaknesses, and tailor your training to achieve peak performance with detailed assessments from expert trainers.",
          bio: "We offer advanced performance testing services to help you achieve your full athletic potential. Our trainers conduct comprehensive assessments to determine your strength, endurance, speed, and agility. With the latest technology, we identify your strengths and identify areas for improvement. Based on the results, we design a customized training plan that will enhance your performance and help you achieve your goals. Whether you’re a beginner or an experienced athlete, our performance testing ensures you train smarter and more efficiently",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/recovery-performance-training/inquiry/"
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
          image: upload('/2024/05/Stength.png'),
          subtitle: "STRENGTH +",
          title: "Conditioning",
          excerpt: "Boost your athletic performance with our strength and conditioning programs. With personalized workouts, you'll build muscle, improve endurance, and boost your overall performance.",
          bio: "Our strength and conditioning programs will enhance your athletic performance. Our trainers design customized workout programs tailored to your individual goals, whether you want to build muscle, improve your endurance, or enhance your overall wellness. We improve your strength, agility, and resilience by utilizing cutting-edge techniques and equipment. All levels of athletes are welcome, from beginners to elite athletes. We ensure progressive and safe training at all levels.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/recovery-performance-training/inquiry/"
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
          image: upload('/2024/05/Lessons.png'),
          subtitle: "TRAINING",
          title: "Programs",
          excerpt: "Get the right training program for you and achieve your physical activities and wellness goals. The program will provide training regimens that will boost your performance, boost your strength, and sharpen your skills.",
          bio: "We specialize in creating training programs that will help you reach your athletic potential. Based on your unique goals and abilities, our coaches customize routines aimed at strengthening your body, improving your skills, and enhancing performance. No matter what sport, event, or fitness goal you’re trying to achieve, our programs incorporate cutting-edge techniques and equipment to help you succeed. All levels, including beginners and elite athletes, can benefit from our measurable results-oriented training programs. Let us support and guide you along your athletic journey as you commit to your goals.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/recovery-performance-training/inquiry/"
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
        href: "/services/recovery-performance-training-services/"
      }
    },
    recent: {
      title: "RECENT CASE STUDIES & RESOURCES",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Nutrition-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/recovery-performance-training/articles/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Training-Girl-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/recovery-performance-training/photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Running-People-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      italic: true,
      title: "NUTRITION & PERFORMANCE PROGRAMMING FAQ's",
      items: [
        {
          question: "What services do you offer for sports performance enhancement?",
          answer: "Personalized training programs, strength and conditioning coaching, performance testing, and nutrition counseling are all available through our partnerships."
        },
        {
          question: "Do you offer sports-specific training programs?",
          answer: "Yes, we provide sports-specific training programs designed for individual athletes and teams, with a focus on game strategies, performance optimization, and skill development."
        },
        {
          question: "Can you help with injury prevention and rehabilitation?",
          answer: "Certainly, we offer injury prevention strategies, injury assessments, rehabilitation programs, physical therapy, and sports medicine consultations through our partnerships."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/our-services/recovery-performance/"
      }
    }
  },
  {
    slug: "procurement-logistics",
    meta: {
      title: "Trusted Procurement Company Services: Compete Like Pros™",
      description: "Simplify sourcing with our sports equipment procurement services. Get affordable, reliable access to the gear your athletes need."
    },
    hero: {
      title: [
        "Procurement / Logistics",
        "Management Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "We Provide Efficient Procurement And Logistics Management. Our Experience Can Help Successfully Optimize Operations, Ensure Timely Deliveries, And Enhance Performance.",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "Streamline your operations with a comprehensive procurement and logistics solution. With precision and efficiency, we handle sourcing, purchasing, and delivery. As we optimize your supply chain, reduce costs, and increase productivity, you can focus on growing your business.",
      italic: true
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Boxes.png'),
          subtitle: "INVENTORY CONTROL",
          title: "Services",
          excerpt: "Our inventory control solutions can help you optimize your business operations. With real-time tracking, accurate forecasting, and efficient management, we reduce costs, prevent stockouts, and maximize profitability.",
          bio: "Control your inventory with our comprehensive inventory control solutions. You’ll enjoy real-time tracking, precise forecasting, and efficient management with our advanced systems. By utilizing our tailored approach, we can reduce costs, prevent stockouts, and eliminate excess inventory. You can make informed decisions and improve overall operational efficiency by using our detailed analytics and reporting. Small or large, our inventory control services streamline processes, improve productivity, and boost profits.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/procurement-logistics/inquiry/"
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
          image: upload('/2024/05/Buyer.png'),
          subtitle: "SOURCING +",
          title: "Purchasing Goods",
          excerpt: "Take advantage of our sourcing and purchasing expertise to streamline your supply chain. To reduce costs and improve efficiency, we identify quality suppliers, negotiate competitive prices, and ensure timely delivery.",
          bio: "We provide professional sourcing and purchasing services to help you optimize your supply chain. In addition to identifying high-quality suppliers and negotiating the best prices, we set up timely deliveries. As part of our process, our team conducts comprehensive market research and evaluates suppliers to ensure that you receive the most value for your investment. You can reduce procurement costs, enhance efficiency, and ensure consistent product quality with our expertise.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/procurement-logistics/inquiry/"
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
          image: upload('/2024/05/Shipping.png'),
          subtitle: "SHIPPING +",
          title: "Transportation",
          excerpt: "Timely delivery of goods is ensured by efficient transportation and shipping services.",
          bio: "Our shipping and transportation solutions are designed to optimize logistics, reduce transit times, and enhance supply chain efficiency, ensuring your.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/procurement-logistics/inquiry/"
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
          image: upload('/2024/05/Manufacturing.png'),
          subtitle: "SUPPLY CHAIN",
          title: "Optimization",
          excerpt: "Utilizing advanced analytics and strategic insights, we optimize supply chains, from procurement to distribution, ensuring efficiency, cost-effectiveness, and resilience.",
          bio: "Our expertise in supply chain optimization encompasses meticulous analysis, strategic planning, and innovative solutions, with the goal of enhancing efficiency, reducing costs, minimizing risks, and maximizing value across every stage of your supply chain, resulting in sustained growth and competitive advantage in dynamic markets.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/procurement-logistics/inquiry/"
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
        href: "/services/procurement-logistics-management/"
      }
    },
    recent: {
      title: "RECENT CASE STUDIES & RESOURCES",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Ship-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/procurement-logistics/articles/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Delivery-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/procurement-logistics/photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Warehouse-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      italic: true,
      title: "PROCUREMENT / LOGISTICS MANAGEMENT FAQ's",
      items: [
        {
          question: "What procurement and logistics services do you offer?",
          answer: "Our procurement and logistics services include sourcing and purchasing goods, shipping and transportation management, inventory control, and supply chain optimization."
        },
        {
          question: "Which industries do you specialize in for procurement and logistics?",
          answer: "We specialize in sports and wellness, but our mother company, Soxcessful supports a variety of industries, including retail, manufacturing, healthcare, technology, and more. Depending on the industry, we tailor our services to meet its specific needs."
        },
        {
          question: "Do you offer global procurement and logistics solutions?",
          answer: "As part of our global procurement and logistics services, we provide international sourcing, import/export services, customs clearance, and distribution services."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/our-services/procurement-logistics/"
      }
    }
  },
  {
    slug: "sports-tourism",
    meta: {
      title: "International Sports Travel Tours: Compete Like Pros™",
      description: "Travel with a leading sports tourism company offering athlete training camps, fan trips, and international sports travel packages."
    },
    hero: {
      title: [
        "Sports Tourism",
        "Services"
      ],
      backgroundColor: "#0a0a0a",
      video: upload('/2024/03/clp-video.mp4'),
      height: "fullscreen"
    },
    intro: "We Invite You To Join Us For An Exciting Sports Tourism Experience. Sports Enthusiasts And Adventure Travelers Can Enjoy Our Exclusive Sporting Events And Unforgettable Travel Packages.",
    support: {
      title: "DIFFERENT WAYS WE CAN SUPPORT YOU",
      text: "We offer customized sports tourism packages to make sure you get the most out of your trip! Fans can experience exclusive access to pro games, iconic stadiums, and even participate in friendly matches. By traveling to unique venues, attending exclusive events, and enjoying VIP treatment, you can elevate your love of sports. Make your sports dreams a reality!",
      italic: true
    },
    services: {
      items: [
        {
          image: upload('/2024/05/Expeience.png'),
          subtitle: "ACTIVITIES PLANNING +",
          title: "Dining",
          excerpt: "Experience the best in sports tourism with our expertly planned activities and dining. A sports fan's dream trip begins here, with exclusive access to games, stadium tours, and top-rated restaurants.",
          bio: "Discover the ultimate sports tourism experience with our meticulously planned dining and activities. You can attend major league games, receive behind-the-scenes stadium tours, and meet sports legends. A variety of top-rated local restaurants feature curated menus that exemplify the city’s sports culture, included in our packages. No matter where you’re sitting, whether you’re watching or eating, we ensure every experience is memorable.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/sports-tourism/inquiry/"
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
          image: upload('/2024/05/money.png'),
          subtitle: "FUNDRAISING",
          title: "Management",
          excerpt: "Ensure a stress-free and unforgettable experience for every sports enthusiast by staying in top-rated accommodations and traveling comfortably with our dedicated services.",
          bio: "Take advantage of our comprehensive hotel and transportation services to enhance your sports tourism adventure. During your stay with us, we will ensure your comfort and convenience by providing top-rated accommodations close to major sports venues. For your convenience, we offer private transfers, VIP shuttle services, and flexible travel arrangements. With seamless logistics and personalized service, you can focus on the excitement of the game from the moment you arrive. It doesn’t matter if you’re traveling alone or with a group, we’ll take care of all the details so you can have a stress-free and enjoyable trip.",
          bioItalic: true,
          cta: {
            label: "Start a Project",
            href: "/sports-tourism/inquiry/"
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
          image: upload('/2024/05/Transportation.png'),
          subtitle: "HOTELS +",
          title: "Logistics",
          excerpt: "Embark on an unforgettable sports tourism experience with our premier venues and game experiences. For a truly unforgettable adventure, you'll gain access to top stadiums, VIP seating, and behind-the-scenes tours.",
          bio: "Take your sports tourism journey to the next level with our exceptional venues and game experiences. Our services include VIP seating, luxury suites, and behind-the-scenes tours at world-renowned stadiums. Premium tickets let you watch the action up close and enjoy special events, such as player meet-and-greets and post-game celebrations. You will feel like a true insider with our tailored experiences and unique opportunities to engage with sports you love. Whether it’s a thrill of the game or the luxurious surroundings of an elite venue, we deliver unforgettable memories for every sports enthusiast.",
          cta: {
            label: "Start a Project",
            href: "/sports-tourism/inquiry/"
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
          image: upload('/2024/05/Venue.png'),
          subtitle: "VENUE & CULTURAL",
          title: "Experiences",
          excerpt: "Embark on an unforgettable sports tourism experience with our premier venues and game experiences. For a truly unforgettable adventure, you'll gain access to top stadiums, VIP seating, and behind-the-scenes tours.",
          bio: "Take your sports tourism journey to the next level with our exceptional venues and game experiences. Our services include VIP seating, luxury suites, and behind-the-scenes tours at world-renowned stadiums. Premium tickets let you watch the action up close and enjoy special events, such as player meet-and-greets and post-game celebrations. You will feel like a true insider with our tailored experiences and unique opportunities to engage with sports you love. Whether it’s a thrill of the game or the luxurious surroundings of an elite venue, we deliver unforgettable memories for every sports enthusiast.",
          cta: {
            label: "Start a Project",
            href: "/sports-tourism/inquiry/"
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
        label: "VIEW MORE",
        href: "/services/sports-tourism-services/"
      }
    },
    recent: {
      title: "RECENT CASE STUDIES & RESOURCES",
      tiles: [
        {
          title: "ARTICLES",
          image: upload('/2024/05/Sports-Tourism-2-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/sports-tourism/articles/",
          newTab: true
        },
        {
          title: "PHOTOS",
          image: upload('/2024/05/Sports-Tourism-3-1024x682.png'),
          width: 1024,
          height: 682,
          href: "/sports-tourism/photos/",
          newTab: true
        },
        {
          title: "VIDEOS",
          image: upload('/2024/05/Sports-Tourism-4-1024x682.png'),
          width: 1024,
          height: 682,
          href: "https://www.youtube.com/@CompeteLikePros",
          newTab: true
        }
      ]
    },
    faq: {
      italic: true,
      title: "SPORTS TOURISM FAQ's",
      items: [
        {
          question: "What types of sports tourism services do you offer?",
          answer: "With our sports tourism offerings, we coordinate travel and accommodations for teams and fans, select and manage venues, and offer customized sports experiences."
        },
        {
          question: "Which sports do you specialize in for sports tourism?",
          answer: "We specialize in all sorts of sports, including soccer, basketball, baseball, golf, tennis, and more. In order to accommodate different sports and events, we can customize our services."
        },
        {
          question: "Do you offer packages for individual travelers or just for teams?",
          answer: "Both individuals and teams can take advantage of our packages. We can assist you whether you’re traveling as a solo traveler or as part of a team seeking comprehensive travel arrangements."
        }
      ],
      viewAll: {
        label: "VIEW ALL",
        href: "https://faq.competelikepros.com/our-services/sports-tourism/"
      }
    }
  }
];

export const getServicePage = (slug: string) => servicePages.find((p) => p.slug === slug);
