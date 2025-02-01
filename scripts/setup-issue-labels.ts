import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GIT_TOKEN;
const OWNER = 'luigigalli';
const REPO = 'TEN_2_Replit';

interface Label {
  name: string;
  color: string;
  description: string;
}

const statusLabels: Label[] = [
  {
    name: 'status: in queue',
    color: 'c5def5',
    description: 'Issue is queued for development'
  },
  {
    name: 'status: developing',
    color: '0075ca',
    description: 'Issue is currently being developed'
  },
  {
    name: 'status: testing',
    color: 'fbca04',
    description: 'Issue implementation is being tested'
  },
  {
    name: 'status: reviewing',
    color: 'd93f0b',
    description: 'Issue is under review'
  },
  {
    name: 'status: approved',
    color: '0e8a16',
    description: 'Issue changes have been approved'
  },
  {
    name: 'status: discarded',
    color: '000000',
    description: 'Issue has been discarded'
  },
  {
    name: 'status: merged',
    color: '6f42c1',
    description: 'Issue changes have been merged'
  }
];

async function createLabel(label: Label) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/labels`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(label),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 422) {
        console.log(`Label "${label.name}" already exists. Updating...`);
        return updateLabel(label);
      }
      throw new Error(`Failed to create label: ${error}`);
    }

    console.log(`Created label: ${label.name}`);
    return response.json();
  } catch (error) {
    console.error(`Error creating label ${label.name}:`, error);
    throw error;
  }
}

async function updateLabel(label: Label) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/labels/${encodeURIComponent(label.name)}`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: label.color,
          description: label.description,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update label: ${error}`);
    }

    console.log(`Updated label: ${label.name}`);
    return response.json();
  } catch (error) {
    console.error(`Error updating label ${label.name}:`, error);
    throw error;
  }
}

async function setupLabels() {
  if (!GITHUB_TOKEN) {
    throw new Error('GIT_TOKEN environment variable is required');
  }

  console.log('Setting up issue status labels...');
  
  for (const label of statusLabels) {
    try {
      await createLabel(label);
    } catch (error) {
      console.error(`Failed to setup label ${label.name}:`, error);
    }
  }
  
  console.log('Label setup completed!');
}

// Run the setup
setupLabels().catch(console.error);
