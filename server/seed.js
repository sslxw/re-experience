const { readJson, writeJson } = require('./store');

const SYSTEM_USER_ID = 'agent-umbrella-001';

const SAMPLE_POSTS = [
    {
        id: 'post-001',
        authorId: SYSTEM_USER_ID,
        title: 'Spencer Mansion — Initial Survey',
        excerpt:
            'The mansion is not what it appears on the maps. Multiple locked wings and evidence of recent habitation.',
        bodyHtml:
            '<h2>Field Summary</h2><p>The Spencer estate exhibits <strong>anomalous structural layouts</strong> inconsistent with municipal records.</p><ul><li>Basement chemical odors detected at 340 ppm</li><li>Armory wing sealed from interior</li><li><strong>Radio contact with Bravo team lost at 22:00</strong> — no further response</li></ul><p>Recommend full tactical deployment before nightfall.</p><p><em>Cross-ref: Investigation / alpha-team</em></p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1518709268805-4e9042af2179?w=800&h=450&fit=crop',
        category: 'Investigation',
        tags: ['mansion', 'alpha-team', 'priority-alpha', 'game-intel'],
        featured: true,
        published: true,
        createdAt: '1998-07-24T22:15:00.000Z',
        updatedAt: '1998-07-24T22:15:00.000Z',
    },
    {
        id: 'post-002',
        authorId: SYSTEM_USER_ID,
        title: 'T-Virus Containment Status: CRITICAL',
        excerpt:
            'Samples from the underground lab show active viral replication at room temperature.',
        bodyHtml:
            '<h2>Lab Analysis</h2><p>Pathogen designation on file: <strong>T-Virus</strong>. All field agents must assume <strong>secondary airborne exposure</strong> protocols immediately.</p><blockquote>Umbrella HQ has not responded to our last six transmissions.</blockquote><p>Containment breach probability estimated at <u>87%</u> within 48 hours.</p><p>Store all samples under UV lock — sample ledger tag <strong>UV-042</strong> pending destruction.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop',
        category: 'Biohazard',
        tags: ['t-virus', 'lab', 'critical', 'game-intel'],
        featured: true,
        published: true,
        createdAt: '1998-07-25T04:02:00.000Z',
        updatedAt: '1998-07-25T04:02:00.000Z',
    },
    {
        id: 'post-003',
        authorId: SYSTEM_USER_ID,
        title: 'RPD Perimeter Collapse — Night Log',
        excerpt:
            'Barricades at Main Street failed. Civilian evacuation routes compromised.',
        bodyHtml:
            '<h2>Perimeter Report</h2><p>At <strong>03:14</strong>, hostiles breached the <strong>east barricade</strong> on Main Street. Ammunition reserves at 12%.</p><ol><li>Seal underground parking access</li><li>Relocate survivors to STARS office</li><li>Await extraction — ETA unknown</li></ol><p>Helicopter callsign for STARS lift: <strong>EAGLE-6</strong> (never arrived).</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1473620860361-126eaa8836e3?w=800&h=450&fit=crop',
        category: 'Operations',
        tags: ['rpd', 'evacuation', 'night-log', 'game-intel'],
        featured: false,
        published: true,
        createdAt: '1998-07-26T01:30:00.000Z',
        updatedAt: '1998-07-26T01:30:00.000Z',
    },
    {
        id: 'post-004',
        authorId: SYSTEM_USER_ID,
        title: 'Underground Site NEST — Briefing',
        excerpt:
            'Confirmed Umbrella research complex beneath the city. Codename matches European files.',
        bodyHtml:
            '<h2>Facilities Intel</h2><p>Blueprints recovered from the tram terminal reference an underground research block codenamed <strong>NEST</strong> (Nemesis Extermination &amp; Testing).</p><p>Primary elevator shaft sealed behind biometric locks. Secondary access may exist via the cemetery maintenance route.</p><p><strong>Journal note:</strong> Raccoon Protocol teams should log the facility codename exactly as written in this file.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
        category: 'Facilities',
        tags: ['nest', 'underground', 'umbrella', 'game-intel'],
        featured: true,
        published: true,
        createdAt: '1998-07-26T09:00:00.000Z',
        updatedAt: '1998-07-26T09:00:00.000Z',
    },
    {
        id: 'post-005',
        authorId: SYSTEM_USER_ID,
        title: 'Agent S — Extraction Dossier',
        excerpt:
            'Sealed personnel packet for field operative S. Extraction codes and clearance routing.',
        bodyHtml:
            '<h2>Personnel — Eyes Only</h2><p>Operative designation: <strong>Agent S</strong>. Assignment: Raccoon City archival recovery.</p><p>Upon verification of all Raccoon Protocol intel entries, authorize extraction using clearance code <strong>S-7734</strong> at the STARS rooftop pad.</p><p>Do not transmit this code over open radio. Confirm via field journal only.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop',
        category: 'Personnel',
        tags: ['agent-s', 'extraction', 'classified', 'game-intel'],
        featured: true,
        published: true,
        createdAt: '1998-07-26T11:45:00.000Z',
        updatedAt: '1998-07-26T11:45:00.000Z',
    },
    {
        id: 'post-006',
        authorId: SYSTEM_USER_ID,
        title: 'U.B.C.S. Deployment Roster',
        excerpt:
            'Mercenary platoons inbound from Umbrella HQ. Civilian districts marked expendable.',
        bodyHtml:
            '<h2>Operations Brief</h2><p>Units <strong>Alpha</strong>, <strong>Bravo</strong>, and <strong>Delta</strong> staged at the highway checkpoint. Rules of engagement: recover G-virus samples; suppress witnesses.</p><p>Radio discipline enforced — call signs only, no real names on open channel.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1579968902534-1b3a66f3c1e4?w=800&h=450&fit=crop',
        category: 'Operations',
        tags: ['ubcs', 'deployment', 'umbrella'],
        featured: false,
        published: true,
        createdAt: '1998-07-25T18:20:00.000Z',
        updatedAt: '1998-07-25T18:20:00.000Z',
    },
    {
        id: 'post-007',
        authorId: SYSTEM_USER_ID,
        title: 'Hospital Ward 4 — Triage Log',
        excerpt:
            'Overwhelmed staff report bite victims exhibiting cannibalistic aggression.',
        bodyHtml:
            '<h2>Medical</h2><p>Dr. Hodkin ordered ward lockdown at 01:02. Supply cache code for pharmacy: <strong>CEDAR-9</strong> (not required for journal protocol).</p><p>Patient zero trace leads to the sewers — coordinate with Facilities.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=450&fit=crop',
        category: 'Medical',
        tags: ['hospital', 'triage', 'infected'],
        featured: false,
        published: true,
        createdAt: '1998-07-25T22:40:00.000Z',
        updatedAt: '1998-07-25T22:40:00.000Z',
    },
    {
        id: 'post-008',
        authorId: SYSTEM_USER_ID,
        title: 'Sewer Map Annotations',
        excerpt:
            'Hand-drawn routes between the RPD basement and the industrial zone.',
        bodyHtml:
            '<h2>Infrastructure</h2><p>Flood gates B-2 and B-7 lead toward the chemical plant. Water samples match NEST effluent signatures.</p><p>Mark all entries with UV chalk — prior team used green phosphor.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=450&fit=crop',
        category: 'Facilities',
        tags: ['sewers', 'maps', 'nest'],
        featured: false,
        published: true,
        createdAt: '1998-07-26T06:15:00.000Z',
        updatedAt: '1998-07-26T06:15:00.000Z',
    },
    {
        id: 'post-009',
        authorId: SYSTEM_USER_ID,
        title: 'Press Conference Transcript (Suppressed)',
        excerpt:
            'Official statement blaming the outbreak on terrorist activity — internal copy marked fiction.',
        bodyHtml:
            '<h2>Public Relations</h2><p>Spokesperson denied any corporate liability. Internal memo contradicts every public claim.</p><p>Useful only for background — no journal answers here.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
        category: 'Investigation',
        tags: ['cover-up', 'media'],
        featured: false,
        published: true,
        createdAt: '1998-07-24T16:00:00.000Z',
        updatedAt: '1998-07-24T16:00:00.000Z',
    },
    {
        id: 'post-010',
        authorId: SYSTEM_USER_ID,
        title: 'Orphanage Evacuation — Failed',
        excerpt:
            'Transport buses never reached the courtyard. Scratch marks on interior doors.',
        bodyHtml:
            '<h2>Civilian</h2><p>Survivors barricaded on the second floor. Ammunition low. Request immediate STARS support.</p><p>Audio log references the mansion survey team — see Investigation files.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=450&fit=crop',
        category: 'Operations',
        tags: ['civilian', 'evacuation'],
        featured: false,
        published: true,
        createdAt: '1998-07-26T04:50:00.000Z',
        updatedAt: '1998-07-26T04:50:00.000Z',
    },
    {
        id: 'post-011',
        authorId: SYSTEM_USER_ID,
        title: 'STARS Office — Room Assignment',
        excerpt:
            'Field operatives directed to secure the west wing archive terminal. Room number on file.',
        bodyHtml:
            '<h2>Operations — STARS</h2><p>All Raccoon Protocol agents reporting to the RPD west wing must check in at <strong>Room 254</strong> before accessing the archive terminal.</p><p>Doors auto-lock after 23:00. If the placard reads another number, you are in the wrong wing — reorient using the stairwell map.</p><p><em>Journal note:</em> Log the room number exactly as issued in this memo.</p>',
        coverImageUrl:
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
        category: 'Operations',
        tags: ['stars', 'rpd', 'room-assignment', 'game-intel'],
        featured: false,
        published: true,
        createdAt: '1998-07-26T10:15:00.000Z',
        updatedAt: '1998-07-26T10:15:00.000Z',
    },
];

const SAMPLE_COMMENTS = [
    {
        id: 'comment-001',
        postId: 'post-001',
        name: 'Barry B.',
        email: 'barry@stars.local',
        body: 'I found something in the library. Do not go alone.',
        createdAt: '1998-07-25T08:00:00.000Z',
    },
    {
        id: 'comment-002',
        postId: 'post-002',
        name: 'Rebecca C.',
        email: 'rebecca@stars.local',
        body: 'T-Virus replication curve matches the Arklay data. Burn the samples.',
        createdAt: '1998-07-25T10:30:00.000Z',
    },
    {
        id: 'comment-003',
        postId: 'post-004',
        name: 'Ada W.',
        email: 'ada@unknown.net',
        body: 'NEST access cards are useless after the flood. Find another route.',
        createdAt: '1998-07-26T12:00:00.000Z',
    },
];

function mergePosts(existingPosts) {
    const byId = new Map(existingPosts.map((p) => [p.id, p]));
    for (const post of SAMPLE_POSTS) {
        const cur = byId.get(post.id);
        const isGameIntel = (post.tags || []).includes('game-intel');
        if (!cur || !cur.bodyHtml || cur.bodyHtml.length < 80 || isGameIntel) {
            byId.set(post.id, post);
        }
    }
    return [...byId.values()].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
}

function mergeComments(existingComments) {
    const byId = new Map(existingComments.map((c) => [c.id, c]));
    for (const comment of SAMPLE_COMMENTS) {
        if (!byId.has(comment.id)) {
            byId.set(comment.id, comment);
        }
    }
    return [...byId.values()];
}

function seedIfEmpty() {
    const users = readJson('users.json', { users: [] });
    if (!users.users.find((u) => u.id === SYSTEM_USER_ID)) {
        users.users.push({
            id: SYSTEM_USER_ID,
            email: 'archive@umbrella.raccoon',
            name: 'RPD Archive Unit',
            avatarUrl: null,
            onboarded: true,
            createdAt: new Date().toISOString(),
        });
        writeJson('users.json', users);
    }

    const posts = readJson('posts.json', { posts: [] });
    const needsFullSeed =
        posts.posts.length === 0 || !posts.posts[0]?.bodyHtml;
    if (needsFullSeed) {
        posts.posts = SAMPLE_POSTS;
    } else {
        posts.posts = mergePosts(posts.posts);
    }
    writeJson('posts.json', posts);

    const comments = readJson('comments.json', { comments: [] });
    comments.comments = mergeComments(comments.comments);
    writeJson('comments.json', comments);

    writeJson('sessions.json', readJson('sessions.json', { sessions: {} }));
}

module.exports = { seedIfEmpty, SYSTEM_USER_ID, SAMPLE_POSTS };
