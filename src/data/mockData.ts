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
    description: 'Legal authorization for new building construction, fence walls, structural renovations, and commercial installations in ABCMA.',
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
    receiptNumber: 'ABCMA-REC-2026-004812'
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
    receiptNumber: 'ABCMA-REC-2026-005118'
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
    resolutionNotes: 'ABCMA mechanized excavator and desilting crew mobilized on site. 70% of concrete box culvert cleared; final truck carting scheduled for Wednesday.',
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
    resolutionNotes: 'Base course stabilized and asphaltic overlay patching successfully completed by ABCMA road maintenance unit on Feb 28.',
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
    resolutionNotes: 'Ticket acknowledged by ABCMA Taskforce. Sanitary inspector assigned for site inspection and placement of warning signage.',
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
    resolutionNotes: 'Backfilling with boulders and gravel ongoing by ABCMA road graders to restore stability prior to asphalt seal.',
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
    email: 'abosseyokai@abcma.gov.gh',
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
    email: 'lartebiokorshie@abcma.gov.gh',
    term: '2024 - 2028',
    officeHours: 'Mondays & Wednesdays, 9:00 AM - 1:00 PM (ABCMA Assembly Complex)'
  },
  {
    id: 'am-3',
    name: 'Hon. Clement K. Agbemenya',
    title: 'Elected Assembly Member',
    electoralArea: 'Mataheko Electoral Area',
    committee: 'Environmental Health & Sanitation Subcommittee',
    phone: '0277-331-894',
    email: 'mataheko@abcma.gov.gh',
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
    email: 'gbortsui@abcma.gov.gh',
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
    email: 'sukura@abcma.gov.gh',
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
    email: 'towncouncilline@abcma.gov.gh',
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
    email: 'mabrouk@abcma.gov.gh',
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
    venue: 'ABCMA Municipal Conference Auditorium, Lartebiokorshie',
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
      'Rollout of ABCMA Youth Vocational Apprenticeship Scheme (auto mechanics, fashion, ICT)',
      'Subsidized startup toolkits for accredited trade trainees',
      'Registration desk for National Youth Authority & ABCMA Social Welfare support'
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
    fundingSource: 'GoG District Assembly Common Fund (DACF) & ABCMA IGF',
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
    fundingSource: 'Secondary Cities Infrastructure Support & ABCMA Capital Fund',
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
    fundingSource: 'Ministry of Roads & Highways / ABCMA Joint Works',
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
    fundingSource: 'ABCMA Sanitation Levy & Environmental Protection Grant',
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
    fundingSource: 'ABCMA Internally Generated Revenue (IGF) & Trade Facility',
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
    fundingSource: 'ABCMA Special Education Fund & Ghana Investment Fund for Electronic Communications (GIFEC)',
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
    fundingSource: 'GoG GETFund / ABCMA Joint Educational Development Grant',
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
    title: 'ABCMA Gazetted Fee-Fixing Resolution (2026 Fiscal Year)',
    category: 'Fee-Fixing',
    gazetteNumber: 'Ghana Local Government Bulletin No. 14 / ABCMA-2026',
    year: 2026,
    fileSize: '3.8 MB',
    fileName: 'ABCMA_2026_Gazetted_Fee_Fixing_Resolution.pdf',
    department: 'Finance & Budget Rating Directorate',
    summary: 'Statutory schedule of all rates, fees, fines, and licenses payable across commercial, residential, industrial, and transport categories in Ablekuma Central.',
    keyProvisions: [
      'Property rate impost schedules for 1st, 2nd, and 3rd Class residential and commercial zones.',
      'Business Operating Permit (BOP) annual classifications for Abossey Okai spare parts dealers, pharmacies, hospitality, and MSMEs.',
      'Prescribed mobile money (MoMo) and GH-Link electronic settlement channels with instant QR receipts.'
    ]
  },
  {
    id: 'doc-2',
    title: 'ABCMA Environmental Sanitation & Noise Abatement Bye-Laws',
    category: 'Bye-Laws',
    gazetteNumber: 'Local Government Instrument L.I. 2248',
    year: 2024,
    fileSize: '2.1 MB',
    fileName: 'ABCMA_Sanitation_Noise_Abatement_ByeLaws.pdf',
    department: 'Environmental Health & Sanitation Unit (EHSU)',
    summary: 'Regulations governing food safety, public health screening, commercial waste disposal obligations, quiet hours, and penalties for indiscriminate dumping.',
    keyProvisions: [
      'Mandatory registration with accredited solid waste concessionaires for all households and commercial stores.',
      'Decibel ceiling thresholds for religious centres, pubs, and event venues after 10:00 PM in residential quarters.',
      'On-the-spot sanitation court summons procedures and administrative spot fines for open drain dumping.'
    ]
  },
  {
    id: 'doc-3',
    title: '2026 Annual Composite Budget & Internally Generated Funds Plan',
    category: 'Budget',
    gazetteNumber: 'ABCMA-FIN-REP-2026-VOL1',
    year: 2026,
    fileSize: '5.2 MB',
    fileName: 'ABCMA_2026_Annual_Composite_Budget.pdf',
    department: 'Budget & Finance Unit',
    summary: 'Approved municipal budget allocation across capital infrastructure, health, education, administration, and projected revenue streams.',
    keyProvisions: [
      'Capital expenditure allocations prioritizing Abossey Okai and Sukura flood mitigation storm drains.',
      'Projected Internally Generated Funds (IGF) targets alongside District Assembly Common Fund (DACF) transfers.',
      'Quarterly public accountability disclosure benchmarks aligned with the Public Financial Management Act (Act 921).'
    ]
  },
  {
    id: 'doc-4',
    title: 'National Competitive Tender: Desilting & Road Paving Lots 1 to 4',
    category: 'Tenders',
    gazetteNumber: 'ABCMA/PROC/NCT/2026/08',
    year: 2026,
    fileSize: '1.4 MB',
    fileName: 'ABCMA_NCT_2026_08_Drainage_Road_Paving_Tender.pdf',
    department: 'Procurement & Municipal Works Directorate',
    summary: 'Invitation for sealed bids from Ministry of Works and Housing registered contractors (Category D1/K1) for 2026 municipal projects.',
    keyProvisions: [
      'Eligibility requirements: Valid PPA registration, GRA Tax Clearance, SSNIT, and MWH Category D1/K1 certificates.',
      'Bill of Quantities summary covering reinforced concrete U-drains, kerbs, and asphaltic surfacing lots.',
      'Bid security submission rules and public tender opening schedule at Block A Conference Hall.'
    ]
  },
  {
    id: 'doc-5',
    title: 'ABCMA Building Permitting & Physical Spatial Planning Bye-Laws',
    category: 'Bye-Laws',
    gazetteNumber: 'L.I. 2380 / ABCMA-PPD-2025',
    year: 2025,
    fileSize: '2.8 MB',
    fileName: 'ABCMA_Building_Permitting_Spatial_ByeLaws.pdf',
    department: 'Physical Planning & Works Department',
    summary: 'Mandatory structural regulations for new commercial buildings, setback requirements along stormwater easements, and temporary structure licensing.',
    keyProvisions: [
      'Prohibition of permanent or temporary structures encroaching on statutory storm drain reservations and road corridors.',
      '30-day statutory Spatial Planning Committee review timeline for complete architectural & structural submissions.',
      'Mandatory soil test and structural engineer endorsement for developments exceeding two storeys.'
    ]
  },
  {
    id: 'doc-6',
    title: 'Market Tolls, Lorry Stations & Commercial Transport Operations Bye-Laws',
    category: 'Fee-Fixing',
    gazetteNumber: 'Bulletin No. 22 / ABCMA-TRANS-2026',
    year: 2026,
    fileSize: '1.9 MB',
    fileName: 'ABCMA_Market_Tolls_Transport_ByeLaws_2026.pdf',
    department: 'Transport & Revenue Operations Unit',
    summary: 'Prescribed daily toll rates for trotros, taxis, and hawkers across Abossey Okai, Flamingo, and Town Council Line terminals.',
    keyProvisions: [
      'Authorized market stall daily ticket denominations and monthly lockable store rent schedules.',
      'Designated loading bay regulations for GPRTU, PROTOA, and cooperative commercial drivers.',
      'Sticker renewal verification protocol along commercial spare parts loading zones.'
    ]
  },
  {
    id: 'doc-7',
    title: '2025 Audited Internally Generated Funds (IGF) Financial Performance Report',
    category: 'Budget',
    gazetteNumber: 'ABCMA-AUDIT-2025-FIN',
    year: 2026,
    fileSize: '4.6 MB',
    fileName: 'ABCMA_2025_Audited_IGF_Performance_Report.pdf',
    department: 'Internal Audit & Finance Directorate',
    summary: 'Comprehensive financial statement and value-for-money audit of revenue collected and disbursed across municipal drainage and lighting.',
    keyProvisions: [
      'Audited year-on-year IGF revenue growth breakdown across Property Rates, BOP, and Market Fees.',
      'Capital project disbursement reconciliation and contractor retention account audit summary.',
      'Internal Audit Committee compliance certifications per Ghana Audit Service standards.'
    ]
  },
  {
    id: 'doc-8',
    title: 'Tender Invitation: Solid Waste Concessionaires & Communal Transfer Stations',
    category: 'Tenders',
    gazetteNumber: 'ABCMA/PROC/WM/2026/03',
    year: 2026,
    fileSize: '1.7 MB',
    fileName: 'ABCMA_Solid_Waste_Concessionaires_Tender_2026.pdf',
    department: 'Procurement & EHSU',
    summary: 'Bidding guidelines for accredited private waste management contractors to service domestic zones and market skips in Sukura and Gbortsui.',
    keyProvisions: [
      'Compactor fleet capacity minimums, GPS tracking compliance, and daily skip evacuation guarantees.',
      'Environmental Protection Agency (EPA) operational clearance requirements for haulage contractors.',
      'Service level penalty clauses for missed residential collection cycles.'
    ]
  },
  {
    id: 'doc-9',
    title: 'ABCMA Public Health & Food Handlers Certification Bye-Laws',
    category: 'Bye-Laws',
    gazetteNumber: 'Local Government Bulletin No. 09 / ABCMA-EHSU',
    year: 2025,
    fileSize: '2.3 MB',
    fileName: 'ABCMA_Food_Handlers_Public_Health_ByeLaws.pdf',
    department: 'Environmental Health & Sanitation Unit',
    summary: 'Sanitary protocols requiring annual medical examinations, clean water source certification, and disinfestation for restaurants, bakeries, and chop bars.',
    keyProvisions: [
      'Annual typhoid, hepatitis, and general medical screening certification requirement for all food preparers.',
      'Premises hygiene grading display mandate for restaurants, cold stores, and sachet water depots.',
      'Routine quarterly fumigation and vector control verification.'
    ]
  },
  {
    id: 'doc-10',
    title: '2026 Composite Annual Procurement Plan for Educational & Medical Facilities',
    category: 'Tenders',
    gazetteNumber: 'ABCMA/PPA/APP/2026/01',
    year: 2026,
    fileSize: '3.1 MB',
    fileName: 'ABCMA_2026_Composite_Procurement_Plan.pdf',
    department: 'Procurement Unit',
    summary: 'Approved Public Procurement Authority (PPA) schedule of hospital beds, medical consumables, school desks, and IT equipment tenders.',
    keyProvisions: [
      'Procurement schedule for Lartebiokorshie Mother & Child Health Pavilion medical equipment.',
      'Mono and dual classroom desk supply timelines for basic schools across Mataheko and Sukura.',
      'E-GP portal submission guidelines for prospective domestic suppliers.'
    ]
  },
  {
    id: 'doc-11',
    title: '2026–2029 Medium Term Development Plan (MTDP) Executive Summary & Ward Matrix',
    category: 'Reports',
    gazetteNumber: 'NDPC / ABCMA-MPCU-2026',
    year: 2026,
    fileSize: '6.4 MB',
    fileName: 'ABCMA_MTDP_2026_2029_Executive_Summary.pdf',
    department: 'Municipal Planning Coordinating Unit (MPCU)',
    summary: 'Four-year strategic development blueprint outlining priority infrastructure, climate resilience, education, and local economic interventions across all 7 electoral areas.',
    keyProvisions: [
      'Ward-by-ward needs assessment compiled from public town hall consultations in all 7 electoral areas.',
      'Multi-year stormwater drainage, solar streetlight expansion, and maternal healthcare capacity goals.',
      'Monitoring and Evaluation (M&E) key performance indicators reported to NDPC.'
    ]
  },
  {
    id: 'doc-12',
    title: 'ABCMA Client Service Charter & Statutory Service Turnaround Handbook',
    category: 'Guides',
    gazetteNumber: 'OHLCS / ABCMA-CSC-2026',
    year: 2026,
    fileSize: '1.6 MB',
    fileName: 'ABCMA_Client_Service_Charter_2026.pdf',
    department: 'Central Administration & Client Service Unit',
    summary: 'Official citizen service standards detailing processing timelines, required documents, walk-in room numbers, and complaint escalation channels at Block A.',
    keyProvisions: [
      'Guaranteed turnaround times: 3–5 days for BOP renewals, 21 days for Ordinance Marriage, 30 days for Building Permits.',
      'Right to Information (RTI Act 989) formal request form and officer contact directory.',
      'Zero-bribery and cashless digital payment charter protecting ratepayers.'
    ]
  },
  {
    id: 'doc-13',
    title: 'Business Operating Permit (BOP) & Commercial Zoning Application Guide',
    category: 'Guides',
    gazetteNumber: 'ABCMA-REV-GUIDE-2026-02',
    year: 2026,
    fileSize: '1.8 MB',
    fileName: 'ABCMA_BOP_Application_Compliance_Guide.pdf',
    department: 'Revenue & Physical Planning Units',
    summary: 'Step-by-step PDF handbook for traders, shopkeepers, auto spare-parts dealers, and corporate entities registering or renewing their annual BOP.',
    keyProvisions: [
      'Checklist of required documents: Registrar General Certificate, Ghana Card, TIN, and GhanaPostGPS address.',
      'Commercial zoning compatibility rules for workshops, warehouses, and retail stores.',
      'Step-by-step instructions for online MoMo renewal and instant e-Tax Clearance download.'
    ]
  },
  {
    id: 'doc-14',
    title: 'Building & Development Permit Architectural Submission Checklist',
    category: 'Guides',
    gazetteNumber: 'ABCMA-PPD-CHECKLIST-2026',
    year: 2026,
    fileSize: '2.5 MB',
    fileName: 'ABCMA_Development_Permit_Submission_Checklist.pdf',
    department: 'Physical Planning & Works Directorate',
    summary: 'Technical specification checklist for landowners, architects, and developers submitting residential or multi-storey commercial building plans for approval.',
    keyProvisions: [
      'Required architectural, structural, electrical, and fire-service endorsed drawing sets (4 copies).',
      'Lands Commission land title / indenture search verification and block plan scale standards.',
      'Mandatory EPA & Fire Certificate conditions for commercial, fuel station, or multi-storey complexes.'
    ]
  },
  {
    id: 'doc-15',
    title: '2026 General Assembly Town Hall Minutes & Citizens Resolutions Compendium',
    category: 'Reports',
    gazetteNumber: 'ABCMA-GA-MINUTES-2026-Q1',
    year: 2026,
    fileSize: '3.2 MB',
    fileName: 'ABCMA_2026_TownHall_Minutes_Resolutions.pdf',
    department: 'Office of the Presiding Member & Central Admin',
    summary: 'Published minutes and formal policy resolutions adopted during the First Ordinary General Assembly sitting and public fee-fixing hearings.',
    keyProvisions: [
      'Summary of citizen memoranda submitted by residents of Mataheko, Sukura, Abossey Okai, and Lartebiokorshie.',
      'Approved Assembly recommendations on Abossey Okai traffic decongestion and market illumination.',
      'Attendance roll of Elected & Government-Appointed Assembly Members and Sub-Committee chairs.'
    ]
  },
  {
    id: 'doc-16',
    title: 'District Assembly Common Fund (DACF) & 3% Disability Support Guidelines',
    category: 'Reports',
    gazetteNumber: 'ABCMA-SWCD-PWD-2026',
    year: 2026,
    fileSize: '1.5 MB',
    fileName: 'ABCMA_3Percent_Disability_Fund_Guidelines.pdf',
    department: 'Social Welfare & Community Development',
    summary: 'Eligibility criteria, vetting committee schedule, and application requirements for Persons with Disabilities seeking business, medical, or educational grants.',
    keyProvisions: [
      'Application requirements: Ghana Card, PWD Federation verification, and itemized startup or assistive-aid request.',
      'Priority support tracks covering vocational trade equipment, medical surgeries, and tertiary tuition.',
      'Quarterly vetting calendar and Social Services Sub-Committee transparency audit procedures.'
    ]
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
    email: 'centraladmin@abcma.gov.gh',
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
    headImageUrl: '/images/director.jpg'
  },
  {
    id: 'dept-hr',
    name: 'Human Resource Department',
    shortCode: 'HR',
    category: 'admin',
    head: 'Mrs. Lydia Afriyie',
    headTitle: 'Municipal Human Resource Manager',
    room: 'Block A, Second Floor, Room 205',
    phone: '+233 (0) 302 228 903',
    email: 'hr@abcma.gov.gh',
    description: 'Manages staff recruitment, postings, continuous capacity building, staff welfare, internships, and performance management across all ABCMA directorates.',
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
    headImageUrl: '/images/hr.jpg'
  },
  {
    id: 'dept-mis',
    name: 'Management Information Systems Department',
    shortCode: 'MIS',
    category: 'technical',
    head: 'Mr Justice Marfo',
    headTitle: 'Head of Management Information Systems',
    room: 'Block A, Ground Floor, Room 012 (Tech Hub)',
    phone: '+233 (0) 302 228 906',
    email: 'mis@abcma.gov.gh',
    description: 'Spearheads ACMA’s digital transformation, portal infrastructure, online revenue billing gateways, GIS municipal mapping, database administration, and cyber security.',
    coreFunctions: [
      'Managing ABCMA public digital portal, revenue collection APIs & MoMo gateways',
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
    headImageUrl: '/images/uknown.jpg'
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
    email: 'works@abcma.gov.gh',
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
    email: 'socialwelfare@abcma.gov.gh',
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
    headImageUrl: '/images/uknown.jpg'
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
    email: 'planning@abcma.gov.gh',
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
    headImageUrl: '/images/Physical_planning.jpg'
  },
  {
    id: 'dept-finance',
    name: 'Finance & Revenue Mobilization Directorate',
    shortCode: 'Finance',
    category: 'finance',
    head: 'Mr. Sakibu Ahmed',
    headTitle: 'Municipal Finance Officer (MFO)',
    room: 'Block A, Ground Floor, Room 08',
    phone: '+233 (0) 302 228 910',
    email: 'finance@abcma.gov.gh',
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
    headImageUrl: '/images/uknown.jpg'
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
    email: 'sanitation@abcma.gov.gh',
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
    headImageUrl: '/images/uknown.jpg'
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
    email: 'nadmo@abcma.gov.gh',
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
    headImageUrl: '/images/uknown.jpg'
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
    email: 'agriculture@abcma.gov.gh',
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
    headImageUrl: '/images/uknown.jpg'
  }
];

import { MunicipalNewsItem } from '../types';

export const MUNICIPAL_NEWS: MunicipalNewsItem[] = [
  {
    id: 'news-1',
    title: '2026 BOP & Property Rates Early-Bird Compliance Window Now Open with Instant MoMo Reconciliation',
    newsScope: 'local',
    category: 'Notice',
    date: '10 March 2026',
    author: 'Finance & Revenue Directorate',
    location: 'Municipal Assembly Complex, Lartebiokorshie',
    imageUrl: '/images/acma_civic_headquarters_1794370608615.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-700/50',
    excerpt: 'All shop owners, automotive dealers in Abossey Okai, pharmacies, and property owners across Ablekuma Central are reminded to verify their 2026 assessments. Direct payments via MTN MoMo, Telecel Cash, and AT Money now provide instant official e-receipts and compliance certificates.',
    content: 'Under the Local Governance Act 2016 (Act 936) and the 2026 Gazetted Fee-Fixing Resolution, rate notices have been dispatched. Business owners are urged to settle before March 31, 2026 to avoid statutory enforcement penalties.',
    fullStory: [
      'The Finance & Revenue Mobilization Directorate of Ablekuma Central Municipal Assembly (ABCMA) has officially opened the 2026 Early-Bird Business Operating Permit (BOP) and Property Rate compliance window for all commercial operators, landlords, and institutional property owners.',
      'Under the Local Governance Act, 2016 (Act 936) and the 2026 Gazetted Fee-Fixing Resolution, updated assessment demand notices have been served across Abossey Okai, Lartebiokorshie, Mataheko, Gbortsui, Sukura, Town Council Line, and Mabrouk.',
      'To eliminate manual paper delays and revenue leakages, ratepayers can look up their Bill Number online through the ABCMA Billing Portal and complete full or partial settlements via MTN MoMo, Telecel Cash, AT Money, or GH-Link debit cards. Each transaction automatically generates a QR-verifiable digital receipt recognized by banking institutions and municipal compliance inspectors.',
      'Commercial enterprises that clear their 2026 dues before March 31, 2026 automatically qualify for instant digital Municipal Tax Clearance generation without visiting Block A.'
    ],
    targetPage: 'service',
    targetLabel: 'Pay Rates & BOP Now'
  },
  {
    id: 'news-2',
    title: 'Abossey Okai Stormwater Channel Phase 1 Reaches 85% Completion Ahead of Seasonal Rains',
    newsScope: 'local',
    category: 'Infrastructure',
    date: '8 March 2026',
    author: 'Municipal Works Department',
    location: 'Abossey Okai Spare Parts Corridor',
    imageUrl: '/images/municipal_works_project_1794370610757.jpg',
    readTime: '4 min read',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-700/50',
    excerpt: 'The 1.2km engineered reinforced concrete stormwater box culvert along the commercial spare parts corridor has reached critical milestones, diverting peak stormwater runoff into the primary Odaw channel and protecting over 400 spare parts retail shops.',
    content: 'Municipal Works Engineer Ing. Stephen Annan inspected the ongoing pouring of twin-cell culverts. Paving of approach aprons and safety guardrails will be finalized by April 2026.',
    fullStory: [
      'Civil engineering works on the 1.2-kilometer Abossey Okai Reinforced Concrete Stormwater Channel have crossed the 85% completion mark following intensive concrete box-culvert casting by the contracted D1/K1 consortium.',
      'During a technical site inspection led by Municipal Works Engineer Ing. Stephen Kwaku Annan alongside Works Subcommittee Assembly Members, engineers confirmed that all three twin-cell junction culverts tying into the primary Odaw outflow basin are structurally complete.',
      'For years, heavy June and September rains flooded automotive spare-parts shops and disrupted vehicular traffic along the Abossey Okai corridor. The widened hydraulic cross-section is engineered to double peak discharge capacity and prevent backflow into adjoining side lanes.',
      'Final works over the next four weeks will focus on sidewalk slab decking, pedestrian safety guardrails, and asphaltic reinstatement of driveway aprons ahead of official commissioning.'
    ],
    targetPage: 'projects',
    targetLabel: 'View Projects Tracker'
  },
  {
    id: 'news-3',
    title: 'Social Welfare Department Disburses 3% DACF Disability Fund & Distributes Youth Artisan Toolkits',
    newsScope: 'local',
    category: 'Welfare',
    date: '4 March 2026',
    author: 'Social Welfare & Community Development',
    location: 'ABCMA Civic Plaza Forecourt, Lartebiokorshie',
    imageUrl: '/images/acma_civic_plaza_bg_1794482218453.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-rose-950 text-rose-400 border-rose-700/50',
    excerpt: 'Over 120 beneficiaries received customized trade equipment including industrial sewing machines, heavy-duty automotive toolboxes, welding machines, and assistive mobility devices funded by the District Assembly Common Fund.',
    content: 'Hon. Municipal Chief Executive emphasized that economic inclusion for Persons with Disabilities (PWDs) remains a non-negotiable pillar of ABCMA civic governance.',
    fullStory: [
      'Ablekuma Central Municipal Assembly has disbursed the first-quarter tranche of the 3% District Assembly Common Fund (DACF) allocation for Persons with Disabilities alongside customized startup toolkits for 120 youth apprentices.',
      'Items distributed at the Lartebiokorshie Municipal Forecourt included heavy-duty industrial sewing machines, deep freezers for micro-retailing, automotive diagnostic kits, welding sets, wheelchairs, and educational tuition support cheques.',
      'Speaking at the ceremony, Hon. Frank Nkansah (MCE) underscored that providing productive capital equipment—rather than one-off cash handouts—empowers beneficiaries to run sustainable household enterprises across all 7 electoral areas.',
      'Prospective applicants for the Q2 vetting cycle can download the official 3% DACF Eligibility Guidelines PDF in the Documents repository or visit Block C, Room 015.'
    ],
    targetPage: 'departments',
    targetLabel: 'Read on Social Welfare Dept'
  },
  {
    id: 'news-4',
    title: 'General Assembly Announces Public Hearings for 2026/2027 Medium Term Development Plan (MTDP)',
    newsScope: 'local',
    category: 'Assembly',
    date: '28 February 2026',
    author: 'Office of the Presiding Member',
    location: 'General Assembly Chamber, Lartebiokorshie',
    imageUrl: '/images/acma_townhall_meeting_1794370609788.jpg',
    readTime: '2 min read',
    badgeColor: 'bg-blue-950 text-blue-400 border-blue-700/50',
    excerpt: 'Residents, market women associations, transport unions, and youth leaders are invited to participate in open consultative hearings across Lartebiokorshie, Sukura, and Town Council Line to prioritize communal projects.',
    content: 'Submissions of memoranda and oral deliberations will inform the final gazetted budget allocation for school expansions and solar streetlight networks.',
    fullStory: [
      'The Office of the Presiding Member and the Municipal Planning Coordinating Unit (MPCU) have published the schedule for town hall public hearings informing the 2026/2027 Medium Term Development Plan (MTDP) and Composite Budget.',
      'Sessions are open to all residents, traditional authorities, market queens, artisans, religious leaders, and civil society organizations across the 7 electoral areas.',
      'Priority agenda items include siting of additional communal refuse transfer bays, prioritization of inner-lane solar street lighting in Sukura and Gbortsui, and expansion of public basic school ICT laboratories.',
      'Citizens who cannot attend in person may submit formal written memoranda directly through the Town Halls & Hearings portal under The Assembly tab.'
    ],
    targetPage: 'assembly',
    targetLabel: 'Attend Assembly Town Hall'
  },
  {
    id: 'news-5',
    title: 'Environmental Health Unit Launches Intensive Medical Screening for Food Handlers & Vendors',
    newsScope: 'local',
    category: 'Health',
    date: '24 February 2026',
    author: 'Environmental Health & Sanitation Unit (EHSU)',
    location: 'Mataheko Flamingo & Town Council Line Markets',
    imageUrl: '/images/abossey_okai_district_1794370608977.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-teal-950 text-teal-400 border-teal-700/50',
    excerpt: 'Mobile clinical screening vans have deployed to Mataheko Flamingo Market, Town Council Line Market, and Abossey Okai to test and issue certified medical clearance cards for commercial food preparers.',
    content: 'The mandatory exercise aims to eliminate foodborne pathogens and ensure hygienic public consumption across food joints, chop bars, and restaurants.',
    fullStory: [
      'The Environmental Health & Sanitation Unit (EHSU), led by Sanitary Inspector Patience Korkor Tetteh, has launched a municipality-wide mobile clinical screening campaign for commercial food handlers, caterers, bakers, and street food vendors.',
      'Mobile screening stations operated in partnership with the Municipal Health Directorate are stationed sequentially at Mataheko Flamingo Market, Town Council Line Market, and Abossey Okai to minimize travel disruption for traders.',
      'Vendors who complete screening receive tamper-resistant annual Health Clearance ID Cards valid across Greater Accra as mandated by the ABCMA Public Health & Food Handlers Certification Bye-Laws.',
      'Following the 21-day mobile screening window, sanitary inspectors will conduct routine compliance audits across chop bars, cold stores, and school feeding kitchens.'
    ],
    targetPage: 'service',
    targetLabel: 'Apply for Health Clearance'
  },
  {
    id: 'news-6',
    title: 'Commissioning of 6-Unit Modern Primary Block at Lartebiokorshie Cluster of Schools',
    newsScope: 'local',
    category: 'Infrastructure',
    date: '20 February 2026',
    author: 'Municipal Education Directorate & Works',
    location: 'Lartebiokorshie Electoral Area',
    imageUrl: '/images/ablekuma_assembly_welcome_1794372179601.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-700/50',
    excerpt: 'The Municipal Chief Executive Hon. Frank Nkansah formally handed over keys to a newly constructed multi-storey educational facility equipped with modern ICT laboratory and sanitation facilities.',
    content: 'Funded under the District Assembly Common Fund and GETFund, the facility will accommodate over 350 pupils and eliminate the double-shift school schedule in the sub-metro area.',
    fullStory: [
      'Hon. Frank Nkansah, Municipal Chief Executive for Ablekuma Central, joined traditional leaders, teachers, and parents to commission a newly completed 6-unit two-storey classroom block at the Lartebiokorshie Cluster of Schools.',
      'Jointly financed through the District Assembly Common Fund (DACF) and GETFund, the facility houses six sunlit classrooms, a 35-seat networked ICT computer laboratory, headteacher and staff offices, and disability-accessible modern water-closet sanitation blocks.',
      'The Municipal Director of Education noted that the addition of 350 pupil seats immediately relieves overcrowding and phases out the double-shift teaching timetable in Lartebiokorshie.',
      'A dedicated solar-powered borehole connected to elevated poly-tanks guarantees uninterrupted clean drinking water for pupils and staff throughout the academic year.'
    ],
    targetPage: 'projects',
    targetLabel: 'View Education Project'
  },
  {
    id: 'news-7',
    title: 'ABCMA Management Information Systems (MIS) Deploys Instant E-Tax Clearance Portal',
    newsScope: 'local',
    category: 'Notice',
    date: '16 February 2026',
    author: 'Management Information Systems (MIS) Unit',
    location: 'Block A Tech Hub, Lartebiokorshie',
    imageUrl: '/images/assembly_chamber_backdrop_1794482218382.jpg',
    readTime: '2 min read',
    badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-700/50',
    excerpt: 'Business owners who settle their 2026 Business Operating Permits online can now instantly download digitally signed, QR-verifiable Municipal Tax Clearance certificates for banking and commercial compliance.',
    content: 'The new system links directly to the Ghana Revenue Authority TIN database and ABCMA revenue vaults, eliminating bureaucratic paper queues.',
    fullStory: [
      'Led by Head of MIS Mr. Justice Marfo, Ablekuma Central Municipal Assembly has rolled out an automated E-Tax Clearance and Digital Verification Engine integrated directly into the municipal portal.',
      'Previously, local enterprises bidding for public procurement tenders or renewing commercial bank credit facilities waited several working days for stamped paper clearance letters.',
      'With the new MIS portal upgrade, any taxpayer whose 2026 Business Operating Permit or Property Rate balance reads zero receives an instant cryptographically signed verification token and printable receipt.',
      'Additionally, property owners can cross-check their GhanaPostGPS coordinates with GIS rating parcels to resolve billing discrepancies online.'
    ],
    targetPage: 'departments',
    targetLabel: 'Read on MIS Department'
  },
  {
    id: 'news-8',
    title: 'Zonal Pre-Rainy Season Desilting Taskforce Deploys Across Mataheko & Abossey Okai Corridors',
    newsScope: 'local',
    category: 'Infrastructure',
    date: '12 February 2026',
    author: 'Urban Roads & Disaster Prevention',
    location: 'Mataheko & Abossey Okai Corridors',
    imageUrl: '/images/municipal_works_project_1794370610757.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-700/50',
    excerpt: 'A combined taskforce of Urban Roads engineers, NADMO rapid responders, and communal sanitation squads has commenced dredging critical culverts along the Odaw tributary line.',
    content: 'Residents and commercial shopkeepers are requested to desist from discarding solid plastics into open stormwater channels as offenders face municipal court prosecution.',
    fullStory: [
      'Ahead of the major rainy season, ABCMA has mobilized its Urban Roads maintenance unit, NADMO field responders, and contracted waste haulage tippers to desilt primary and secondary drains along the Mataheko, Sukura, and Abossey Okai corridors.',
      'Over 420 metric tonnes of compacted silt, plastic waste, and construction debris have already been cleared and transported directly to accredited landfill transfer sites rather than left along road shoulders.',
      'Municipal Guard officers and Environmental Health Inspectors are patrolling commercial streets to enforce anti-littering bye-laws; residents can also pin choked drains or collapsed slabs in real time via the Citizen Incident Desk.'
    ],
    targetPage: 'projects',
    targetLabel: 'Inspect Works Program'
  },
  {
    id: 'news-9',
    title: 'GARCC Synchronizes Greater Accra Municipal Sanitation & Clean Corridors Operation',
    newsScope: 'other',
    category: 'Health',
    date: '11 March 2026',
    author: 'Greater Accra Regional Coordinating Council (GARCC)',
    location: 'Greater Accra Region',
    imageUrl: '/images/acma_civic_plaza_bg_1794482218453.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700/50',
    excerpt: 'All 29 Metropolitan, Municipal, and District Assemblies in Greater Accra have aligned first-Saturday clean-up exercises and bulk waste transfer logistics along major arterial markets and transport corridors.',
    content: 'The Greater Accra Regional Minister commended frontline assemblies including Ablekuma Central for deploying skip transfer pads and digital sanitation enforcement.',
    fullStory: [
      'The Greater Accra Regional Coordinating Council (GARCC) has unveiled an updated Regional Sanitation Synchronization Framework bringing together all 29 Metropolitan, Municipal, and District Assemblies across Greater Accra.',
      'Under the regional initiative, boundary markets and shared drainage corridors—such as the Kaneshie–Abossey Okai–Odaw arterial belt—receive coordinated mechanized sweepers, joint municipal guard patrols, and synchronized tipper dispatch schedules on the first Saturday of every month.',
      'Residents and traders within Ablekuma Central are encouraged to register with accredited door-to-door waste collectors and utilize the six paved communal skip transfer stations commissioned across the municipality.'
    ],
    targetPage: 'assembly',
    targetLabel: 'View Citizen Incident Desk'
  },
  {
    id: 'news-10',
    title: 'Ministry of Local Government Issues 2026 Digital IGF & Public Accountability Directives',
    newsScope: 'other',
    category: 'Assembly',
    date: '5 March 2026',
    author: 'Ministry of Local Government, Decentralisation & Rural Development',
    location: 'National · Accra',
    imageUrl: '/images/assembly_chamber_backdrop_1794482218382.jpg',
    readTime: '4 min read',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-700/50',
    excerpt: 'New national guidelines mandate all MMDAs to publish quarterly Composite Budget performance summaries online and expand cashless mobile money collection portals to boost citizen trust.',
    content: 'The Ministry highlighted digital ratepayer portals and open document repositories as mandatory benchmarks under the District Performance Assessment Tool (DPAT).',
    fullStory: [
      'The Ministry of Local Government, Decentralisation and Rural Development (MLGDRD) has circulated the 2026 Composite Budget Transparency & Digital Revenue Guidelines for implementation across all 261 MMDAs nationwide.',
      'Key directives require Assemblies to transition commercial Business Operating Permits and Property Rate billing onto cashless mobile money and card gateways, publish audited Internally Generated Funds (IGF) reports openly, and maintain accessible citizen Right to Information (RTI) submission channels.',
      'Ablekuma Central Municipal Assembly already satisfies core DPAT digital transparency benchmarks through its public Gazetted Documents Repository and QR-verified digital payment receipts.'
    ],
    targetPage: 'documents',
    targetLabel: 'Browse Gazetted Documents'
  },
  {
    id: 'news-11',
    title: 'NADMO & Ghana Meteorological Agency Release 2026 Coastal Rainy Season Flood Early-Warning Advisory',
    newsScope: 'other',
    category: 'Notice',
    date: '1 March 2026',
    author: 'National NADMO & GMet Joint Desk',
    location: 'Greater Accra Coastal Belt',
    imageUrl: '/images/abossey_okai_district_1794370608977.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700/50',
    excerpt: 'Meteorological forecasts indicate above-average peak rainfall bursts between May and July across low-lying Accra basins. Citizens are advised to inspect household roof gutters and keep drainage easements clear.',
    content: 'Emergency flood hotlines remain active 24/7 across municipal NADMO rapid response stations.',
    fullStory: [
      'A joint seasonal forecast bulletin issued by the Ghana Meteorological Agency (GMet) and the National Disaster Management Organization (NADMO) urges households and market associations across coastal Greater Accra to complete roof, culvert, and electrical safety checks ahead of May.',
      'Flood resilience engineers advise motorists and pedestrians never to attempt crossing fast-moving storm channels during intense cloudbursts and to elevate inventory pallets in ground-level commercial warehouses.',
      'Within Ablekuma Central, residents spotting blocked street gratings, fallen trees, or damaged utility lines can log GPS-tagged alerts directly via the Incident Desk for dispatch to the Municipal NADMO unit in Block C.'
    ],
    targetPage: 'departments',
    targetLabel: 'Contact ABCMA NADMO Desk'
  },
  {
    id: 'news-12',
    title: 'Ghana Enterprises Agency & GIFEC Open Digital Trade & Artisan MSME Support Window',
    newsScope: 'other',
    category: 'Welfare',
    date: '22 February 2026',
    author: 'Ghana Enterprises Agency & GIFEC Partner Desk',
    location: 'Greater Accra Business Hub',
    imageUrl: '/images/acma_townhall_meeting_1794370609788.jpg',
    readTime: '3 min read',
    badgeColor: 'bg-violet-950 text-violet-300 border-violet-700/50',
    excerpt: 'Registered artisans, spare parts retailers, seamstresses, and youth-led micro-enterprises holding valid municipal Business Operating Permits can apply for subsidized business formalization and digital bookkeeping training.',
    content: 'The ABCMA Social Welfare and Central Administration desks are assisting eligible local entrepreneurs with introductory endorsement letters.',
    fullStory: [
      'The Ghana Enterprises Agency (GEA), working in collaboration with GIFEC and Municipal Business Advisory desks, has opened applications for the 2026 Urban MSME Growth & Digital Commerce Support Window.',
      'Eligible sole proprietors, fashion designers, automotive mechanics, and cold-chain traders in Ablekuma Central receive subsidized access to accounting software training, e-commerce onboarding, and equipment matching grants.',
      'Applicants must present a valid Ghana Card, active GRA TIN, and a current 2026 Municipal Business Operating Permit (BOP). Visit the Social Welfare Department or apply for your BOP online through the ABCMA Services section to qualify.'
    ],
    targetPage: 'service',
    targetLabel: 'Apply for Business Permit'
  }
];


