import {
  BillRecord,
  MunicipalService,
  CitizenIssue,
  AssemblyMember,
  TownHallMeeting,
  MunicipalProject,
  GazettedDocument
} from '../types';

export const INITIAL_SERVICES: MunicipalService[] = [
  {
    id: 'srv-bop',
    category: 'business',
    title: 'Business Operating Permit (BOP)',
    description: 'Mandatory statutory authorization required for all commercial entities, shops, workshops, and enterprises operating within Ablekuma Central.',
    processingTime: '3 - 5 Working Days',
    statutoryFee: 'Calculated by Business Scale & Category',
    department: 'Revenue & Finance Directorate',
    requirements: [
      'Valid Business Registration Certificate (RGD / ORC)',
      'Ghana Card of Business Owner / Authorized Agent',
      'Digital Address (GhanaPostGPS e.g., GA-124-5832)',
      'Premises Tenancy Agreement or Title Clearance',
      'Environmental Health Inspection Report (Food & hospitality entities)'
    ]
  },
  {
    id: 'srv-building-permit',
    category: 'permits',
    title: 'Building & Development Permit',
    description: 'Legal authorization for new building construction, fence walls, structural renovations, and commercial installations in ACMA.',
    processingTime: '14 - 30 Working Days',
    statutoryFee: 'Based on Gross Floor Area & Class',
    department: 'Physical Planning & Works Directorate',
    requirements: [
      'Four (4) sets of Architectural Drawings endorsed by a certified Architect',
      'Structural Engineering drawings & calculation sheet (for 2+ storeys)',
      'Proof of land ownership / Cadastral site plan certified by Lands Commission',
      'EPA Environmental Permit (for commercial or industrial developments)',
      'Fire Safety Certificate from Ghana National Fire Service'
    ]
  },
  {
    id: 'srv-marriage',
    category: 'civil',
    title: 'Marriage & Civil Registration',
    description: 'Notice of Marriage under the Marriages Act 1884-1985 (Cap 127) and registration of Customary Marriages with certified certificates.',
    processingTime: '21 Days Notice Period (Ordinance)',
    statutoryFee: 'GHS 350.00 (Notice + Registrar Certificate)',
    department: 'Central Administration / Registrar of Marriages',
    requirements: [
      'Ghana Cards of both bride and groom',
      'Two (2) passport-sized photographs of each party',
      'Proof of residence in Ablekuma Central (utility bill or digital address)',
      'Statutory declaration / affidavit of single status if previously unmarried',
      'Witness details (one for each party)'
    ]
  },
  {
    id: 'srv-sanitation-waste',
    category: 'sanitation',
    title: 'Environmental Health & Food Screening',
    description: 'Mandatory medical screening cards for food vendors, commercial sanitary inspection, and waste bin delivery scheduling.',
    processingTime: '48 Hours',
    statutoryFee: 'GHS 80.00 per food vendor / GHS 120 premises check',
    department: 'Environmental Health & Sanitation Unit',
    requirements: [
      'National ID / Ghana Card',
      'Laboratory test clearance for Salmonella, TB, and Hepatitis from accredited municipal clinic',
      'Passport-sized photo for laminated Health Certificate',
      'Location of food preparation / serving area'
    ]
  },
  {
    id: 'srv-road-works',
    category: 'works',
    title: 'Right-of-Way & Temporary Road Permits',
    description: 'Permits for temporary road diversions for civic/community events, utility trenching (telecom/water/power), and drainage culvert construction.',
    processingTime: '48 - 72 Hours',
    statutoryFee: 'GHS 250.00 - GHS 800.00 depending on duration',
    department: 'Department of Urban Roads & Works',
    requirements: [
      'Written request specifying location, street name, and exact hours',
      'Traffic diversion and pedestrian safety mitigation plan',
      'Approval clearance from local Ghana Police Command (Kaneshie/Korle Bu)',
      'Reinstatement bond guarantee for asphalt/pavement reinstatement'
    ]
  }
];

export const INITIAL_BILLS: BillRecord[] = [
  {
    id: 'bill-1',
    billNumber: 'PROP-2026-4019',
    type: 'property_rate',
    title: '2026 Property Rate - Commercial Compound',
    taxpayerName: 'Alhaji Rashid Sulemana & Sons Ltd',
    ghanaCardOrTin: 'GHA-718293847-1',
    phone: '0244123456',
    electoralArea: 'Abossey Okai',
    propertyAddressOrStore: 'Plot 48, Spare Parts Lane, Abossey Okai (GA-142-9981)',
    period: '2026 Fiscal Year',
    assessedValueGHS: 650000,
    amountDueGHS: 1850,
    amountPaidGHS: 0,
    balanceGHS: 1850,
    dueDate: '2026-06-30',
    status: 'unpaid'
  },
  {
    id: 'bill-2',
    billNumber: 'BOP-2026-8812',
    type: 'business_operating_permit',
    title: '2026 Business Operating Permit - Auto Spares Wholesaler',
    taxpayerName: 'K. Osei Automotive & Engineering Spares',
    ghanaCardOrTin: 'C0028919283',
    phone: '0243987654',
    electoralArea: 'Abossey Okai',
    propertyAddressOrStore: 'Block B, Shop 14, Central Market Road, Abossey Okai',
    period: '2026 Calendar Year',
    assessedValueGHS: 320000,
    amountDueGHS: 950,
    amountPaidGHS: 0,
    balanceGHS: 950,
    dueDate: '2026-03-31',
    status: 'unpaid'
  },
  {
    id: 'bill-3',
    billNumber: 'PROP-2026-1044',
    type: 'property_rate',
    title: '2026 Property Rate - Residential 1st Class',
    taxpayerName: 'Madam Grace Naa Densua Aryee',
    ghanaCardOrTin: 'GHA-829103948-2',
    phone: '0208112233',
    electoralArea: 'Lartebiokorshie',
    propertyAddressOrStore: 'House No. LK-88/4, Near Link Road, Lartebiokorshie',
    period: '2026 Fiscal Year',
    assessedValueGHS: 480000,
    amountDueGHS: 720,
    amountPaidGHS: 720,
    balanceGHS: 0,
    dueDate: '2026-05-31',
    status: 'paid',
    lastPaymentDate: '2026-02-14',
    receiptNumber: 'ACMA-REC-2026-004812'
  },
  {
    id: 'bill-4',
    billNumber: 'MKT-2026-0314',
    type: 'market_toll',
    title: 'Town Council Line Market Toll / Stall Annual Rent',
    taxpayerName: 'Auntie Mary Korkor Quarshie',
    ghanaCardOrTin: 'GHA-551029384-9',
    phone: '0277665544',
    electoralArea: 'Town Council Line',
    propertyAddressOrStore: 'Stall No. E-22, Vegetables & Grains Section, TCL Market',
    period: '2026 Annual License',
    assessedValueGHS: 45000,
    amountDueGHS: 360,
    amountPaidGHS: 0,
    balanceGHS: 360,
    dueDate: '2026-04-15',
    status: 'unpaid'
  },
  {
    id: 'bill-5',
    billNumber: 'BOP-2026-3190',
    type: 'business_operating_permit',
    title: '2026 BOP - Community Pharmacy & Healthcare Dispensing',
    taxpayerName: 'Mataheko LifeCare Pharmacy',
    ghanaCardOrTin: 'C0055192837',
    phone: '0245998877',
    electoralArea: 'Mataheko',
    propertyAddressOrStore: 'Main Flamingo Junction, Mataheko (GA-188-4410)',
    period: '2026 Calendar Year',
    assessedValueGHS: 210000,
    amountDueGHS: 650,
    amountPaidGHS: 0,
    balanceGHS: 650,
    dueDate: '2026-03-31',
    status: 'unpaid'
  },
  {
    id: 'bill-6',
    billNumber: 'BOP-2026-5521',
    type: 'business_operating_permit',
    title: '2026 BOP - Sukura Automotive Engineering & Welding Center',
    taxpayerName: 'Sukura Allied Mechanics Union',
    ghanaCardOrTin: 'C0099812411',
    phone: '0555332211',
    electoralArea: 'Sukura',
    propertyAddressOrStore: 'Workshop Cluster 3, Sukura Zongo Road (GA-160-2210)',
    period: '2026 Calendar Year',
    assessedValueGHS: 140000,
    amountDueGHS: 480,
    amountPaidGHS: 0,
    balanceGHS: 480,
    dueDate: '2026-04-30',
    status: 'unpaid'
  },
  {
    id: 'bill-7',
    billNumber: 'PROP-2026-6610',
    type: 'property_rate',
    title: '2026 Property Rate - Gbortsui 2nd Class Residential Compound',
    taxpayerName: 'Hon. Salifu Alhassan Family Trust',
    ghanaCardOrTin: 'GHA-331902847-5',
    phone: '0209661338',
    electoralArea: 'Gbortsui',
    propertyAddressOrStore: 'Compound Plot 12, Gbortsui Main Avenue',
    period: '2026 Fiscal Year',
    assessedValueGHS: 350000,
    amountDueGHS: 525,
    amountPaidGHS: 525,
    balanceGHS: 0,
    dueDate: '2026-06-30',
    status: 'paid',
    lastPaymentDate: '2026-02-18',
    receiptNumber: 'ACMA-REC-2026-005118'
  },
  {
    id: 'bill-8',
    billNumber: 'BOP-2026-7734',
    type: 'business_operating_permit',
    title: '2026 BOP - Abossey Okai Retail Brake & Clutch Depot',
    taxpayerName: 'Accra Premier Auto Spares Enterprise',
    ghanaCardOrTin: 'C0044192019',
    phone: '0244556677',
    electoralArea: 'Abossey Okai',
    propertyAddressOrStore: 'Shop 29, Ring Road West Annex, Abossey Okai',
    period: '2026 Calendar Year',
    assessedValueGHS: 280000,
    amountDueGHS: 850,
    amountPaidGHS: 0,
    balanceGHS: 850,
    dueDate: '2026-03-31',
    status: 'unpaid'
  }
];

export const INITIAL_ISSUES: CitizenIssue[] = [
  {
    id: 'iss-1',
    trackingCode: 'REP-2026-1049',
    category: 'choked_drain',
    title: 'Severe silt accumulation in primary drainage culvert near Spare Parts Zone 3',
    description: 'The concrete stormwater drain has accumulated heavy sand, empty engine oil plastics and debris from recent rains. Poses major flash flood risk if next downpour hits.',
    electoralArea: 'Abossey Okai',
    landmark: 'Behind TotalEnergies Station, off Mortuary Road',
    reportedBy: 'Kwame Boakye',
    contactPhone: '0244991122',
    status: 'in_progress',
    dateReported: '2026-03-02',
    departmentAssigned: 'Works Directorate & Waste Management',
    resolutionNotes: 'ACMA mechanized excavator and desilting crew mobilized on site. 70% of concrete box culvert cleared; final truck carting scheduled for Wednesday.',
    lastUpdated: '2026-03-04'
  },
  {
    id: 'iss-2',
    trackingCode: 'REP-2026-1052',
    category: 'broken_streetlight',
    title: 'Four (4) consecutive streetlights non-functional on Link Road',
    description: 'Stretches from Methodist Church junction towards Lartebiokorshie polyclinic turnoff. Entire stretch is pitch dark after 7 PM causing pedestrian security hazards.',
    electoralArea: 'Lartebiokorshie',
    landmark: 'Between Methodist Church & Town Council Line boundary',
    reportedBy: 'Evelyn Addo-Quaye',
    contactPhone: '0201882233',
    status: 'assigned',
    dateReported: '2026-03-03',
    departmentAssigned: 'Urban Roads & Electrical Engineering Unit',
    resolutionNotes: 'Work order dispatched to electrical maintenance contractor. Replacement LED bulbs and photocell sensors requisitioned.',
    lastUpdated: '2026-03-04'
  },
  {
    id: 'iss-3',
    trackingCode: 'REP-2026-1033',
    category: 'pothole_road',
    title: 'Deep depression and crater forming at Flamingo junction intersection',
    description: 'Vehicle tires are sustaining damage and taxi drivers are making erratic swerves into oncoming traffic. Requires bitumen cold-mix patching.',
    electoralArea: 'Mataheko',
    landmark: 'Flamingo Junction near Goil Filling Station',
    reportedBy: 'Samuel Tetteh Mensah',
    contactPhone: '0277334455',
    status: 'resolved',
    dateReported: '2026-02-24',
    departmentAssigned: 'Department of Urban Roads',
    resolutionNotes: 'Base course stabilized and asphaltic overlay patching successfully completed by ACMA road maintenance unit on Feb 28.',
    lastUpdated: '2026-02-28'
  },
  {
    id: 'iss-4',
    trackingCode: 'REP-2026-1060',
    category: 'refuse_dump',
    title: 'Unauthorized communal dumping on vacant land behind Sukura Market',
    description: 'Commercial waste and polythene sacks are being dumped late at night by non-residents. Smoke from burning plastics is irritating nearby residents.',
    electoralArea: 'Sukura',
    landmark: 'Opposite Sukura ICGC Chapel perimeter',
    reportedBy: 'Rashida Mohammed',
    contactPhone: '0555667788',
    status: 'submitted',
    dateReported: '2026-03-05',
    departmentAssigned: 'Environmental Health & Sanitation Taskforce',
    resolutionNotes: 'Ticket acknowledged by ACMA Taskforce. Sanitary inspector assigned for site inspection and placement of warning signage.',
    lastUpdated: '2026-03-05'
  },
  {
    id: 'iss-5',
    trackingCode: 'REP-2026-1071',
    category: 'choked_drain',
    title: 'Dislodged concrete slab and broken culvert grating along Market Lane',
    description: 'Heavy delivery truck crushed the concrete pedestrian slab over the stormwater ditch, creating a 1.5-meter open hole hazardous to market shoppers and children.',
    electoralArea: 'Town Council Line',
    landmark: 'Opposite GCB Bank Agency, Market Road',
    reportedBy: 'Kofi Owusu',
    contactPhone: '0249112233',
    status: 'assigned',
    dateReported: '2026-03-06',
    departmentAssigned: 'Municipal Works Department',
    resolutionNotes: 'Site surveyed by Works Inspector. Warning cones deployed; pre-cast reinforced replacement slab ordered from yard.',
    lastUpdated: '2026-03-07'
  },
  {
    id: 'iss-6',
    trackingCode: 'REP-2026-1075',
    category: 'broken_streetlight',
    title: 'Solar streetlight battery enclosure vandalized near Community Clinic',
    description: 'Solar panel wire severed and storage battery tampered with. Roadway around the clinic entrance is completely dark after nightfall.',
    electoralArea: 'Gbortsui',
    landmark: 'Gbortsui Clinic Road, 50m before roundabout',
    reportedBy: 'Sister Mary Mensah',
    contactPhone: '0205443322',
    status: 'submitted',
    dateReported: '2026-03-07',
    departmentAssigned: 'Electrical Engineering & Maintenance Unit',
    resolutionNotes: 'Dispatched to Zonal Maintenance team. Security latching reinforcement scheduled.',
    lastUpdated: '2026-03-07'
  },
  {
    id: 'iss-7',
    trackingCode: 'REP-2026-1082',
    category: 'pothole_road',
    title: 'Deep road shoulder washout and gully erosion along Mabrouk Link',
    description: 'Recent stormwater overflow washed away the gravel embankment, narrowing the two-lane street down to a single dangerous lane.',
    electoralArea: 'Mabrouk',
    landmark: 'Near Mabrouk Central Mosque junction',
    reportedBy: 'Alhaji Haruna Yakubu',
    contactPhone: '0543221199',
    status: 'in_progress',
    dateReported: '2026-03-08',
    departmentAssigned: 'Department of Urban Roads',
    resolutionNotes: 'Backfilling with boulders and gravel ongoing by ACMA road graders to restore stability prior to asphalt seal.',
    lastUpdated: '2026-03-09'
  },
  {
    id: 'iss-8',
    trackingCode: 'REP-2026-1089',
    category: 'refuse_dump',
    title: 'Overflowing commercial waste skip requiring urgent tractor carting',
    description: 'The communal 12-cubic-meter skip at the border of Abossey Okai is full to capacity, causing market waste spillage onto the pedestrian walkway.',
    electoralArea: 'Abossey Okai',
    landmark: 'Mortuary Road Junction by Spare Parts Zone 1',
    reportedBy: 'Grace Korkor',
    contactPhone: '0241887766',
    status: 'resolved',
    dateReported: '2026-03-01',
    departmentAssigned: 'Environmental Health & Sanitation Unit',
    resolutionNotes: 'Zoomlion skip loader tractor dispatched; skip evacuated and surrounding pavement disinfected on March 2.',
    lastUpdated: '2026-03-02'
  }
];

export const ASSEMBLY_MEMBERS: AssemblyMember[] = [
  {
    id: 'am-1',
    name: 'Hon. Prince Owusu Boateng',
    title: 'Elected Assembly Member',
    electoralArea: 'Abossey Okai Electoral Area',
    committee: 'Convener, Works & Development Planning Subcommittee',
    phone: '0244-882-190',
    email: 'abosseyokai@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Tuesdays & Thursdays, 10:00 AM - 2:00 PM (Zonal Council Office)'
  },
  {
    id: 'am-2',
    name: 'Hon. Beatrice Naa Ashami Vanderpuye',
    title: 'Elected Assembly Member & Presiding Member',
    electoralArea: 'Lartebiokorshie Electoral Area',
    committee: 'Executive Committee & Finance Subcommittee',
    phone: '0208-114-552',
    email: 'lartebiokorshie@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Mondays & Wednesdays, 9:00 AM - 1:00 PM (ACMA Assembly Complex)'
  },
  {
    id: 'am-3',
    name: 'Hon. Clement K. Agbemenya',
    title: 'Elected Assembly Member',
    electoralArea: 'Mataheko Electoral Area',
    committee: 'Environmental Health & Sanitation Subcommittee',
    phone: '0277-331-894',
    email: 'mataheko@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Wednesdays & Fridays, 11:00 AM - 3:00 PM (Mataheko Community Hall)'
  },
  {
    id: 'am-4',
    name: 'Hon. Mustapha Nii Okai',
    title: 'Elected Assembly Member',
    electoralArea: 'Gbortsui Electoral Area',
    committee: 'Social Services & Education Subcommittee',
    phone: '0243-772-108',
    email: 'gbortsui@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Mondays & Thursdays, 10:00 AM - 2:00 PM'
  },
  {
    id: 'am-5',
    name: 'Hon. Hajia Zeinab Issahaku',
    title: 'Elected Assembly Member',
    electoralArea: 'Sukura Electoral Area',
    committee: 'Gender, Children & Community Protection',
    phone: '0555-449-210',
    email: 'sukura@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Tuesdays & Saturdays, 10:00 AM - 1:00 PM (Sukura Post Point)'
  },
  {
    id: 'am-6',
    name: 'Hon. Joseph Annan Quaye',
    title: 'Elected Assembly Member',
    electoralArea: 'Town Council Line Electoral Area',
    committee: 'Revenue Mobilization & Commerce Subcommittee',
    phone: '0246-990-412',
    email: 'towncouncilline@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Mondays & Fridays, 9:00 AM - 12:00 PM'
  },
  {
    id: 'am-7',
    name: 'Hon. Salifu Alhassan',
    title: 'Elected Assembly Member',
    electoralArea: 'Mabrouk Electoral Area',
    committee: 'Disaster Prevention & Security Subcommittee',
    phone: '0209-661-338',
    email: 'mabrouk@acma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Wednesdays & Thursdays, 10:00 AM - 2:00 PM'
  }
];

export const TOWN_HALLS: TownHallMeeting[] = [
  {
    id: 'th-1',
    title: '2026 Mid-Year Budget & Fee-Fixing Citizen Consultation',
    date: 'Wednesday, April 15, 2026',
    time: '10:00 AM - 1:30 PM',
    venue: 'Presbyterian Church Hall, Abossey Okai Central',
    electoralArea: 'Abossey Okai',
    agenda: [
      'Presentation of 2026 Revised Fee-Fixing Resolution & Property Rates',
      'Audited report on 2025 Internally Generated Funds (IGF) projects',
      'Citizen open-floor feedback and business association dialogue',
      'Briefing by Municipal Director of Urban Roads on ongoing drain works'
    ],
    documentsAttached: 'Draft_2026_Fee_Fixing_Consultation_Brief.pdf',
    rsvpsCount: 142
  },
  {
    id: 'th-2',
    title: 'Town Council Line & Sukura Flood Mitigation & Drainage Hearing',
    date: 'Tuesday, May 12, 2026',
    time: '10:30 AM - 1:00 PM',
    venue: 'ACMA Municipal Conference Auditorium, Lartebiokorshie',
    electoralArea: 'Town Council Line / Sukura',
    agenda: [
      'Pre-monsoon season drainage desilting masterplan review',
      'Enforcement of 100-meter buffer zone along major Odaw-connected stormwater drains',
      'Community sanitation taskforce volunteering recruitment'
    ],
    documentsAttached: 'ACMA_Flood_Risk_Mitigation_Map_2026.pdf',
    rsvpsCount: 89
  },
  {
    id: 'th-3',
    title: 'Mataheko Youth Skills, Vocational Grants & Digital Literacy Forum',
    date: 'Saturday, June 6, 2026',
    time: '9:00 AM - 2:00 PM',
    venue: 'Mataheko Community Centre Forecourt',
    electoralArea: 'Mataheko',
    agenda: [
      'Rollout of ACMA Youth Vocational Apprenticeship Scheme (auto mechanics, fashion, ICT)',
      'Subsidized startup toolkits for accredited trade trainees',
      'Registration desk for National Youth Authority & ACMA Social Welfare support'
    ],
    documentsAttached: 'Youth_Apprenticeship_Guidelines_ACMA.pdf',
    rsvpsCount: 215
  }
];

export const MUNICIPAL_PROJECTS: MunicipalProject[] = [
  {
    id: 'proj-1',
    title: 'Abossey Okai Stormwater Concrete Channel & Culvert Construction',
    electoralArea: 'Abossey Okai',
    description: 'Construction of a 1.2km reinforced concrete U-drain and three twin-cell box culverts to permanently end perennial flooding across the commercial spare parts corridor.',
    percentageComplete: 85,
    budgetGHS: 'GHS 4,250,000',
    fundingSource: 'GoG District Assembly Common Fund (DACF) & ACMA IGF',
    contractor: 'Ofori-Atta Civil Engineering Consortium Ltd',
    startDate: 'November 2025',
    estimatedCompletion: 'May 2026',
    imageUrl: '/images/municipal_works_project_1794370610757.jpg',
    status: 'In Progress'
  },
  {
    id: 'proj-2',
    title: 'Lartebiokorshie Polyclinic Mother & Child Health Pavilion',
    electoralArea: 'Lartebiokorshie',
    description: 'Modern 40-bed maternal health wing with dedicated ultrasound diagnostics, surgical theater for emergencies, and 10 incubator neonatal intensive care unit (NICU).',
    percentageComplete: 92,
    budgetGHS: 'GHS 3,100,000',
    fundingSource: 'Secondary Cities Infrastructure Support & ACMA Capital Fund',
    contractor: 'Apex Horizon Built Environments Ltd',
    startDate: 'August 2025',
    estimatedCompletion: 'April 2026',
    imageUrl: '/images/acma_civic_headquarters_1794370608615.jpg',
    status: 'Near Completion'
  },
  {
    id: 'proj-3',
    title: 'Mataheko - Town Council Line Road Resurfacing & 220 LED Solar Streetlights',
    electoralArea: 'Mataheko & Town Council Line',
    description: 'Asphaltic overlay of 4.8km link roads, road line markings, speed tables near schools, and installation of 220 high-output solar LED streetlight poles.',
    percentageComplete: 65,
    budgetGHS: 'GHS 2,800,000',
    fundingSource: 'Ministry of Roads & Highways / ACMA Joint Works',
    contractor: 'Dan-Adams Highway Contractors Ghana',
    startDate: 'January 2026',
    estimatedCompletion: 'July 2026',
    imageUrl: '/images/municipal_works_project_1794370610757.jpg',
    status: 'In Progress'
  },
  {
    id: 'proj-4',
    title: 'Sukura & Abossey Okai Mechanized Sanitation Skip Stations',
    electoralArea: 'Sukura & Abossey Okai',
    description: 'Construction of 6 paved, odor-controlled communal waste transfer pads with modern roll-on roll-off skips and 24/7 sanitary warden posts.',
    percentageComplete: 100,
    budgetGHS: 'GHS 950,000',
    fundingSource: 'ACMA Sanitation Levy & Environmental Protection Grant',
    contractor: 'Klenam Green Sanitation Services Ltd',
    startDate: 'September 2025',
    estimatedCompletion: 'Completed February 2026',
    imageUrl: '/images/abossey_okai_district_1794370608977.jpg',
    status: 'Commissioned'
  },
  {
    id: 'proj-5',
    title: 'Gbortsui Community Health Post & Pediatric Outpatient Clinic',
    electoralArea: 'Gbortsui',
    description: 'Construction of a primary healthcare center featuring a consultation wing, child immunization ward, dispensary, and solar backup power supply.',
    percentageComplete: 75,
    budgetGHS: 'GHS 1,650,000',
    fundingSource: 'District Assembly Common Fund (DACF)',
    contractor: 'Nana Yaw Built Works Ltd',
    startDate: 'December 2025',
    estimatedCompletion: 'June 2026',
    imageUrl: '/images/acma_civic_headquarters_1794370608615.jpg',
    status: 'In Progress'
  },
  {
    id: 'proj-6',
    title: 'Town Council Line Market Modern Paved Sheds & Fire Hydrant Network',
    electoralArea: 'Town Council Line',
    description: 'Paving of central market stalls, installation of high-pressure fire hydrants, stormwater grates, and secure lockable storage units for dry food traders.',
    percentageComplete: 50,
    budgetGHS: 'GHS 2,150,000',
    fundingSource: 'ACMA Internally Generated Revenue (IGF) & Trade Facility',
    contractor: 'Metro Standard Civil Engineering Ltd',
    startDate: 'February 2026',
    estimatedCompletion: 'August 2026',
    imageUrl: '/images/abossey_okai_district_1794370608977.jpg',
    status: 'In Progress'
  },
  {
    id: 'proj-7',
    title: 'Mabrouk Zonal Digital Community Library & Youth ICT Lab',
    electoralArea: 'Mabrouk',
    description: 'Establishment of a 50-workstation e-library facility with high-speed internet, coding laboratory, and quiet civic research room for students and teachers.',
    percentageComplete: 90,
    budgetGHS: 'GHS 1,200,000',
    fundingSource: 'ACMA Special Education Fund & Ghana Investment Fund for Electronic Communications (GIFEC)',
    contractor: 'Silicon Horizon Infrastructure Ltd',
    startDate: 'October 2025',
    estimatedCompletion: 'April 2026',
    imageUrl: '/images/municipal_works_project_1794370610757.jpg',
    status: 'Near Completion'
  },
  {
    id: 'proj-8',
    title: 'Lartebiokorshie Cluster of Schools 6-Unit Block & Sanitation Block',
    electoralArea: 'Lartebiokorshie',
    description: 'Completed multi-storey primary school block with modern teacher staffroom, computer laboratory, library, and disability-accessible modern water-closet washrooms.',
    percentageComplete: 100,
    budgetGHS: 'GHS 1,850,000',
    fundingSource: 'GoG GETFund / ACMA Joint Educational Development Grant',
    contractor: 'Golden Coast Builders Consortium',
    startDate: 'June 2025',
    estimatedCompletion: 'Handed Over January 2026',
    imageUrl: '/images/acma_civic_headquarters_1794370608615.jpg',
    status: 'Commissioned'
  }
];

export const GAZETTED_DOCUMENTS: GazettedDocument[] = [
  {
    id: 'doc-1',
    title: 'ACMA Gazetted Fee-Fixing Resolution (2026 Fiscal Year)',
    category: 'Fee-Fixing',
    gazetteNumber: 'Ghana Local Government Bulletin No. 14 / ACMA-2026',
    year: 2026,
    fileSize: '3.8 MB',
    summary: 'Statutory schedule of all rates, fees, fines, and licenses payable across commercial, residential, industrial, and transport categories in Ablekuma Central.'
  },
  {
    id: 'doc-2',
    title: 'ACMA Environmental Sanitation & Noise Abatement Bye-Laws',
    category: 'Bye-Laws',
    gazetteNumber: 'Local Government Instrument L.I. 2248',
    year: 2024,
    fileSize: '2.1 MB',
    summary: 'Regulations governing food safety, public health screening, commercial waste disposal obligations, quiet hours, and penalties for indiscriminate dumping.'
  },
  {
    id: 'doc-3',
    title: '2026 Annual Composite Budget & Internally Generated Funds Plan',
    category: 'Budget',
    gazetteNumber: 'ACMA-FIN-REP-2026-VOL1',
    year: 2026,
    fileSize: '5.2 MB',
    summary: 'Approved municipal budget allocation across capital infrastructure, health, education, administration, and projected revenue streams.'
  },
  {
    id: 'doc-4',
    title: 'National Competitive Tender: Desilting & Road Paving Lots 1 to 4',
    category: 'Tenders',
    gazetteNumber: 'ACMA/PROC/NCT/2026/08',
    year: 2026,
    fileSize: '1.4 MB',
    summary: 'Invitation for sealed bids from Ministry of Works and Housing registered contractors (Category D1/K1) for 2026 municipal projects.'
  },
  {
    id: 'doc-5',
    title: 'ACMA Building Permitting & Physical Spatial Planning Bye-Laws',
    category: 'Bye-Laws',
    gazetteNumber: 'L.I. 2380 / ACMA-PPD-2025',
    year: 2025,
    fileSize: '2.8 MB',
    summary: 'Mandatory structural regulations for new commercial buildings, setback requirements along stormwater easements, and temporary structure licensing.'
  },
  {
    id: 'doc-6',
    title: 'Market Tolls, Lorry Stations & Commercial Transport Operations Bye-Laws',
    category: 'Fee-Fixing',
    gazetteNumber: 'Bulletin No. 22 / ACMA-TRANS-2026',
    year: 2026,
    fileSize: '1.9 MB',
    summary: 'Prescribed daily toll rates for trotros, taxis, and hawkers across Abossey Okai, Flamingo, and Town Council Line terminals.'
  },
  {
    id: 'doc-7',
    title: '2025 Audited Internally Generated Funds (IGF) Financial Performance Report',
    category: 'Budget',
    gazetteNumber: 'ACMA-AUDIT-2025-FIN',
    year: 2026,
    fileSize: '4.6 MB',
    summary: 'Comprehensive financial statement and value-for-money audit of revenue collected and disbursed across municipal drainage and lighting.'
  },
  {
    id: 'doc-8',
    title: 'Tender Invitation: Solid Waste Concessionaires & Communal Transfer Stations',
    category: 'Tenders',
    gazetteNumber: 'ACMA/PROC/WM/2026/03',
    year: 2026,
    fileSize: '1.7 MB',
    summary: 'Bidding guidelines for accredited private waste management contractors to service domestic zones and market skips in Sukura and Gbortsui.'
  },
  {
    id: 'doc-9',
    title: 'ACMA Public Health & Food Handlers Certification Bye-Laws',
    category: 'Bye-Laws',
    gazetteNumber: 'Local Government Bulletin No. 09 / ACMA-EHSU',
    year: 2025,
    fileSize: '2.3 MB',
    summary: 'Sanitary protocols requiring annual medical examinations, clean water source certification, and disinfestation for restaurants, bakeries, and chop bars.'
  },
  {
    id: 'doc-10',
    title: '2026 Composite Annual Procurement Plan for Educational & Medical Facilities',
    category: 'Tenders',
    gazetteNumber: 'ACMA/PPA/APP/2026/01',
    year: 2026,
    fileSize: '3.1 MB',
    summary: 'Approved Public Procurement Authority (PPA) schedule of hospital beds, medical consumables, school desks, and IT equipment tenders.'
  }
];

import { MunicipalDepartment } from '../types';

export const MUNICIPAL_DEPARTMENTS: MunicipalDepartment[] = [
  {
    id: 'dept-central-admin',
    name: 'Central Administration Department',
    shortCode: 'Central Admin',
    category: 'admin',
    head: 'Mr. Emmanuel Kofi Boateng',
    headTitle: 'Municipal Coordinating Director (MCD)',
    room: 'Block A, First Floor, Room 102 & 104',
    phone: '+233 (0) 302 228 901',
    email: 'centraladmin@acma.gov.gh',
    description: 'The Secretariat of the Assembly responsible for overall administrative coordination, executive decision implementation, protocol, legal affairs, and public relations.',
    coreFunctions: [
      'Serving as the General Secretariat of the Assembly & Executive Committee',
      'Coordinating all decentralized departments and development partners',
      'Protocol, public relations, records management, and civil marriages under Cap 127',
      'Monitoring execution of General Assembly resolutions and policy directives'
    ],
    servicesOffered: [
      'Ordinance & Customary Marriage Registration',
      'Administrative Clearances & Official Letters of Introduction',
      'Client Service Charters & Public Information Inquiries',
      'Assembly Hall Bookings for Civic Ceremonies'
    ],
    operatingHours: 'Mon - Fri: 8:00 AM - 5:00 PM',
    headImageUrl: '/images/dept_head_admin_1794482218886.jpg'
  },
  {
    id: 'dept-hr',
    name: 'Human Resource Department',
    shortCode: 'HR',
    category: 'admin',
    head: 'Mrs. Abigail Adobea Mensah',
    headTitle: 'Municipal Human Resource Manager',
    room: 'Block A, Second Floor, Room 205',
    phone: '+233 (0) 302 228 903',
    email: 'hr@acma.gov.gh',
    description: 'Manages staff recruitment, postings, continuous capacity building, staff welfare, internships, and performance management across all ACMA directorates.',
    coreFunctions: [
      'Staff development, training needs assessment, and capacity building programs',
      'Civil service human resource management & local government service appraisal',
      'National Service personnel (NSS) and tertiary student internship placements',
      'Staff welfare, occupational safety compliance, and retirement transitions'
    ],
    servicesOffered: [
      'Tertiary Internship & Industrial Attachment Applications',
      'National Service Personnel (NSS) Onboarding & Verification',
      'Capacity Building Workshops & Civic Leadership Seminars',
      'Staff Verification for Civil Service & Financial Institutions'
    ],
    operatingHours: 'Mon - Fri: 8:30 AM - 4:30 PM',
    headImageUrl: '/images/dept_head_admin_1794482218886.jpg'
  },
  {
    id: 'dept-mis',
    name: 'Management Information Systems Department',
    shortCode: 'MIS',
    category: 'technical',
    head: 'Ing. David Kwabena Asare',
    headTitle: 'Head of Management Information Systems',
    room: 'Block A, Ground Floor, Room 012 (Tech Hub)',
    phone: '+233 (0) 302 228 906',
    email: 'mis@acma.gov.gh',
    description: 'Spearheads ACMA’s digital transformation, portal infrastructure, online revenue billing gateways, GIS municipal mapping, database administration, and cyber security.',
    coreFunctions: [
      'Managing ACMA public digital portal, revenue collection APIs & MoMo gateways',
      'Geographic Information Systems (GIS) mapping of properties and street naming',
      'Hardware maintenance, network infrastructure, and database administration',
      'Data analytics on internally generated funds (IGF) and service delivery turnaround'
    ],
    servicesOffered: [
      'Digital Address Verification & GhanaPostGPS Mapping Support',
      'Online Ratepayer Account Assistance & MoMo Receipt Reconciliation',
      'Municipal Open Data Requests & Civic Technology Collaborations',
      'IT Support for Digital Business Operating Permit Applications'
    ],
    operatingHours: 'Mon - Fri: 8:00 AM - 5:00 PM (24/7 Portal Support)',
    headImageUrl: '/images/dept_head_mis_1794482219572.jpg'
  },
  {
    id: 'dept-works',
    name: 'Works Department',
    shortCode: 'Works',
    category: 'technical',
    head: 'Ing. Stephen Kwaku Annan',
    headTitle: 'Municipal Works Engineer',
    room: 'Block B, First Floor, Room 112 & 114',
    phone: '+233 (0) 302 228 907',
    email: 'works@acma.gov.gh',
    description: 'Supervises capital projects, feeder roads, storm drainage infrastructure, street lighting maintenance, and physical structural inspections of residential & commercial developments.',
    coreFunctions: [
      'Execution and monitoring of municipal civil works, drainage culverts, and roads',
      'Building inspection for structural integrity and permit compliance',
      'Municipal streetlights installation, maintenance, and energy management',
      'Preparation of Bills of Quantities (BoQ) and public tender evaluation'
    ],
    servicesOffered: [
      'Site Structural Inspections & Building Permit Vetting',
      'Streetlight Fault Repair & Infrastructure Maintenance Request',
      'Drainage Connection Approvals & Culvert Construction Supervision',
      'Right-of-Way Permits for Utility Excavations'
    ],
    operatingHours: 'Mon - Fri: 8:00 AM - 5:00 PM (Emergency Works On-Call)',
    headImageUrl: '/images/dept_head_engineer_1794482218772.jpg'
  },
  {
    id: 'dept-social-welfare',
    name: 'Department of Social Welfare & Community Development',
    shortCode: 'Social Welfare',
    category: 'social',
    head: 'Ms. Faustina Akua Opare',
    headTitle: 'Municipal Social Welfare & Community Officer',
    room: 'Block C, Ground Floor, Room 015',
    phone: '+233 (0) 302 228 909',
    email: 'socialwelfare@acma.gov.gh',
    description: 'Promotes social justice, child protection, family reconciliation, disability inclusion funds, youth apprenticeship, and community-driven development initiatives.',
    coreFunctions: [
      'Administration of the 3% District Assembly Common Fund for Persons with Disabilities (PWDs)',
      'Child rights enforcement, custody mediation, and foster care supervision',
      'Livelihood Empowerment Against Poverty (LEAP) bi-monthly cash disbursements',
      'Youth vocational skill trainings, community self-help projects, and NGO accreditation'
    ],
    servicesOffered: [
      'Disability (PWD) Support Fund & Assistive Device Grants',
      'Family Welfare, Child Custody & Maintenance Mediation',
      'NGO & Community-Based Organization (CBO) Registration & Clearance',
      'Youth Apprenticeship Sponsorship in Tailoring, Auto Mechanics & ICT'
    ],
    operatingHours: 'Mon - Fri: 8:30 AM - 4:30 PM',
    headImageUrl: '/images/dept_head_welfare_1794482219397.jpg'
  },
  {
    id: 'dept-physical-planning',
    name: 'Physical Planning Department',
    shortCode: 'Physical Planning',
    category: 'planning',
    head: 'Tpl. Kwame Mensah Danquah',
    headTitle: 'Municipal Town Planning Officer',
    room: 'Block B, Ground Floor, Room 04',
    phone: '+233 (0) 302 228 904',
    email: 'planning@acma.gov.gh',
    description: 'Controls spatial layout, zoning schemes, land-use planning, masterplans, and development permit statutory committee secretariat.',
    coreFunctions: [
      'Formulating spatial development frameworks and local zoning schemes',
      'Secretariat of the Spatial Planning Committee (SPC) and Technical Sub-Committee',
      'Processing planning permissions, rezoning applications, and land subdivision',
      'Street naming and property numbering (SNPA) coordination'
    ],
    servicesOffered: [
      'Zoning Search & Land Use Suitability Verification',
      'Development Planning Approvals & Temporary Structure Licenses',
      'Street Naming & Digital Property Identification Certificates',
      'Architectural Layout Consultation for Commercial Hubs'
    ],
    operatingHours: 'Mon - Fri: 8:30 AM - 4:30 PM',
    headImageUrl: '/images/dept_head_engineer_1794482218772.jpg'
  },
  {
    id: 'dept-finance',
    name: 'Finance & Revenue Mobilization Directorate',
    shortCode: 'Finance',
    category: 'finance',
    head: 'Mr. Joseph Nii Armah',
    headTitle: 'Municipal Finance Officer (MFO)',
    room: 'Block A, Ground Floor, Room 08',
    phone: '+233 (0) 302 228 910',
    email: 'finance@acma.gov.gh',
    description: 'Manages municipal public funds, internally generated revenue (IGF), property rates billing, commercial licenses collection, and statutory financial reporting.',
    coreFunctions: [
      'Collection and accounting of property rates, business operating permits, and market tolls',
      'Ensuring compliance with the Public Financial Management Act 2016 (Act 921)',
      'Coordination of revenue taskforces and electronic collection points',
      'Preparation of monthly and annual municipal financial statements'
    ],
    servicesOffered: [
      'Official Receipt Issuance & Tax Clearance Certificates',
      'Property Rate Assessment & Commercial Revaluation Inquiries',
      'Direct MoMo/Bank Payment Verification & Settlement',
      'Installment Payment Arrangements for Micro-Enterprises'
    ],
    operatingHours: 'Mon - Fri: 8:00 AM - 5:00 PM',
    headImageUrl: '/images/dept_head_finance_1794482253363.jpg'
  },
  {
    id: 'dept-health-sanitation',
    name: 'Environmental Health & Sanitation Unit (EHSU)',
    shortCode: 'EHSU',
    category: 'technical',
    head: 'San. Insp. Patience Korkor Tetteh',
    headTitle: 'Municipal Environmental Health Officer',
    room: 'Block C, Ground Floor, Room 02',
    phone: '+233 (0) 302 228 915',
    email: 'sanitation@acma.gov.gh',
    description: 'Ensures public health standards, food vendor screening, market hygiene, cemetery management, and solid waste collection enforcement.',
    coreFunctions: [
      'Routine sanitary inspection of domestic and commercial premises',
      'Mandatory medical screening and certification of food vendors',
      'Enforcement of Assembly sanitation bye-laws and court prosecutions',
      'Supervision of private waste management concessionaires (Zoomlion, etc.)'
    ],
    servicesOffered: [
      'Food Handlers Medical Screening & Certification Cards',
      'Sanitary Inspection Clearance for Restaurants & Cold Stores',
      'Pest Control, Fumigation & Disinfestation Certification',
      'Communal Waste Bin Distribution & Skip Relocation Requests'
    ],
    operatingHours: 'Mon - Fri: 7:30 AM - 4:30 PM (Field Inspections Active)',
    headImageUrl: '/images/dept_head_health_1794482254417.jpg'
  },
  {
    id: 'dept-nadmo',
    name: 'Disaster Prevention & Management (NADMO Desk)',
    shortCode: 'NADMO',
    category: 'technical',
    head: 'Mr. Alhaji Ibrahim Adams',
    headTitle: 'Municipal NADMO Director',
    room: 'Block C, Room 10',
    phone: '+233 (0) 302 228 920',
    email: 'nadmo@acma.gov.gh',
    description: 'Coordinates emergency disaster response, flood contingency planning, public safety education, and relief item distributions.',
    coreFunctions: [
      'Pre-flood vulnerability assessment along critical drainage basins',
      'Community sensitization on fire outbreaks, building collapses, and storm hazards',
      'Rapid emergency rescue dispatch during heavy downpours',
      'Distribution of verified humanitarian relief supplies to affected victims'
    ],
    servicesOffered: [
      'Emergency Flood & Fire Hazard Reporting Desk',
      'Disaster Relief Registration & Assessment',
      'School & Market Safety Drills and Fire Prevention Workshops',
      'Volunteer Disaster Management Committee Recruitment'
    ],
    operatingHours: '24/7 Emergency Operations',
    headImageUrl: '/images/dept_head_finance_1794482253363.jpg'
  },
  {
    id: 'dept-agriculture',
    name: 'Department of Agriculture',
    shortCode: 'Agriculture',
    category: 'social',
    head: 'Dr. Seth Osei Tutu',
    headTitle: 'Municipal Director of Agriculture',
    room: 'Block C, First Floor, Room 108',
    phone: '+233 (0) 302 228 924',
    email: 'agriculture@acma.gov.gh',
    description: 'Supports peri-urban farming, backyard gardening, mushroom cultivation, aquaculture, veterinary health care, and farmer-market linkages.',
    coreFunctions: [
      'Agricultural extension services to urban vegetable growers and livestock keepers',
      'Veterinary services including rabies vaccination and pet licensing',
      'Promotion of modern hydroponics, vertical farming, and agro-processing',
      'Annual National Best Farmer Awards Municipal Celebration'
    ],
    servicesOffered: [
      'Pet & Livestock Rabies Vaccination Services',
      'Free Urban Farming Advisory & Improved Seedling Distribution',
      'Agro-Enterprise Advisory & Value-Addition Training',
      'Veterinary Clinic Consultations & Meat Inspection'
    ],
    operatingHours: 'Mon - Fri: 8:00 AM - 4:30 PM',
    headImageUrl: '/images/dept_head_engineer_1794482218772.jpg'
  }
];

import { MunicipalNewsItem } from '../types';

export const MUNICIPAL_NEWS: MunicipalNewsItem[] = [
  {
    id: 'news-1',
    title: '2026 BOP & Property Rates Early-Bird Compliance Window Now Open with Instant MoMo Reconciliation',
    category: 'Notice',
    date: '10 March 2026',
    author: 'Finance & Revenue Directorate',
    readTime: '3 min read',
    badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-700/50',
    excerpt: 'All shop owners, automotive dealers in Abossey Okai, pharmacies, and property owners across Ablekuma Central are reminded to verify their 2026 assessments. Direct payments via MTN MoMo, Telecel Cash, and AT Money now provide instant official e-receipts and compliance certificates.',
    content: 'Under the Local Governance Act 2016 (Act 936) and the 2026 Gazetted Fee-Fixing Resolution, rate notices have been dispatched. Business owners are urged to settle before March 31, 2026 to avoid statutory enforcement penalties.',
    targetPage: 'service',
    targetLabel: 'Pay Rates & BOP Now'
  },
  {
    id: 'news-2',
    title: 'Abossey Okai Stormwater Channel Phase 1 Reaches 85% Completion Ahead of Seasonal Rains',
    category: 'Infrastructure',
    date: '8 March 2026',
    author: 'Municipal Works Department',
    readTime: '4 min read',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-700/50',
    excerpt: 'The 1.2km engineered reinforced concrete stormwater box culvert along the commercial spare parts corridor has reached critical milestones, diverting peak stormwater runoff into the primary Odaw channel and protecting over 400 spare parts retail shops.',
    content: 'Municipal Works Engineer Ing. Stephen Annan inspected the ongoing pouring of twin-cell culverts. Paving of approach aprons and safety guardrails will be finalized by April 2026.',
    targetPage: 'projects',
    targetLabel: 'View Projects Tracker'
  },
  {
    id: 'news-3',
    title: 'Social Welfare Department Disburses 3% DACF Disability Fund & Distributes Youth Artisan Toolkits',
    category: 'Welfare',
    date: '4 March 2026',
    author: 'Social Welfare & Community Development',
    readTime: '3 min read',
    badgeColor: 'bg-rose-950 text-rose-400 border-rose-700/50',
    excerpt: 'Over 120 beneficiaries received customized trade equipment including industrial sewing machines, heavy-duty automotive toolboxes, welding machines, and assistive mobility devices funded by the District Assembly Common Fund.',
    content: 'Hon. Municipal Chief Executive emphasized that economic inclusion for Persons with Disabilities (PWDs) remains a non-negotiable pillar of ACMA civic governance.',
    targetPage: 'departments',
    targetLabel: 'Read on Social Welfare Dept'
  },
  {
    id: 'news-4',
    title: 'General Assembly Announces Public Hearings for 2026/2027 Medium Term Development Plan (MTDP)',
    category: 'Assembly',
    date: '28 February 2026',
    author: 'Office of the Presiding Member',
    readTime: '2 min read',
    badgeColor: 'bg-blue-950 text-blue-400 border-blue-700/50',
    excerpt: 'Residents, market women associations, transport unions, and youth leaders are invited to participate in open consultative hearings across Lartebiokorshie, Sukura, and Town Council Line to prioritize communal projects.',
    content: 'Submissions of memoranda and oral deliberations will inform the final gazetted budget allocation for school expansions and solar streetlight networks.',
    targetPage: 'assembly',
    targetLabel: 'Attend Assembly Town Hall'
  },
  {
    id: 'news-5',
    title: 'Environmental Health Unit Launches Intensive Medical Screening for Food Handlers & Vendors',
    category: 'Health',
    date: '24 February 2026',
    author: 'Environmental Health & Sanitation Unit (EHSU)',
    readTime: '3 min read',
    badgeColor: 'bg-teal-950 text-teal-400 border-teal-700/50',
    excerpt: 'Mobile clinical screening vans have deployed to Mataheko Flamingo Market, Town Council Line Market, and Abossey Okai to test and issue certified medical clearance cards for commercial food preparers.',
    content: 'The mandatory exercise aims to eliminate foodborne pathogens and ensure hygienic public consumption across food joints, chop bars, and restaurants.',
    targetPage: 'service',
    targetLabel: 'Apply for Health Clearance'
  },
  {
    id: 'news-6',
    title: 'Commissioning of 6-Unit Modern Primary Block at Lartebiokorshie Cluster of Schools',
    category: 'Infrastructure',
    date: '20 February 2026',
    author: 'Municipal Education Directorate & Works',
    readTime: '3 min read',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-700/50',
    excerpt: 'The Municipal Chief Executive Hon. Kwaku Addo Mensah formally handed over keys to a newly constructed multi-storey educational facility equipped with modern ICT laboratory and sanitation facilities.',
    content: 'Funded under the District Assembly Common Fund and GETFund, the facility will accommodate over 350 pupils and eliminate the double-shift school schedule in the sub-metro area.',
    targetPage: 'projects',
    targetLabel: 'View Education Project'
  },
  {
    id: 'news-7',
    title: 'ACMA Management Information Systems (MIS) Deploys Instant E-Tax Clearance Portal',
    category: 'Notice',
    date: '16 February 2026',
    author: 'Management Information Systems (MIS) Unit',
    readTime: '2 min read',
    badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-700/50',
    excerpt: 'Business owners who settle their 2026 Business Operating Permits online can now instantly download digitally signed, QR-verifiable Municipal Tax Clearance certificates for banking and commercial compliance.',
    content: 'The new system links directly to the Ghana Revenue Authority TIN database and ACMA revenue vaults, eliminating bureaucratic paper queues.',
    targetPage: 'departments',
    targetLabel: 'Read on MIS Department'
  },
  {
    id: 'news-8',
    title: 'Zonal Pre-Rainy Season Desilting Taskforce Deploys Across Mataheko & Abossey Okai Corridors',
    category: 'Infrastructure',
    date: '12 February 2026',
    author: 'Urban Roads & Disaster Prevention',
    readTime: '3 min read',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-700/50',
    excerpt: 'A combined taskforce of Urban Roads engineers, NADMO rapid responders, and communal sanitation squads has commenced dredging critical culverts along the Odaw tributary line.',
    content: 'Residents and commercial shopkeepers are requested to desist from discarding solid plastics into open stormwater channels as offenders face municipal court prosecution.',
    targetPage: 'projects',
    targetLabel: 'Inspect Works Program'
  }
];


