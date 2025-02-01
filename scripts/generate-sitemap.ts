import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

interface RouteInfo {
  path: string;
  component: string;
  description?: string;
}

interface ComponentInfo {
  name: string;
  description: string;
  filePath: string;
}

async function scanDirectory(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const paths: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      paths.push(...await scanDirectory(fullPath));
    } else if (file.isFile() && file.name.endsWith('.tsx')) {
      paths.push(fullPath);
    }
  }

  return paths;
}

async function extractRouteInfo(file: string): Promise<RouteInfo[]> {
  const content = await fs.readFile(file, 'utf-8');
  const routes: RouteInfo[] = [];

  // Simple regex to find Route components
  const routeRegex = /<Route[^>]*path=["']([^"']+)["'][^>]*(?:component={([^}]+)})?/g;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    const [, path, component] = match;
    if (path) {
      routes.push({
        path,
        component: component || 'Unknown',
      });
    }
  }

  return routes;
}

async function extractComponentInfo(file: string): Promise<ComponentInfo | null> {
  const content = await fs.readFile(file, 'utf-8');
  const relativePath = path.relative(path.join(ROOT_DIR, 'client/src'), file);
  
  // Simple regex to find component name and description from comments
  const componentRegex = /export\s+(?:default\s+)?(?:function|class)\s+(\w+)/;
  const descriptionRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//;

  const componentMatch = content.match(componentRegex);
  const descriptionMatch = content.match(descriptionRegex);

  if (componentMatch) {
    return {
      name: componentMatch[1],
      description: descriptionMatch ? descriptionMatch[1].replace(/\s*\*\s*/g, ' ').trim() : '',
      filePath: relativePath,
    };
  }

  return null;
}

function groupRoutesBySection(routes: RouteInfo[]): Record<string, RouteInfo[]> {
  const sections: Record<string, RouteInfo[]> = {
    admin: [],
    auth: [],
    user: [],
  };

  routes.forEach(route => {
    if (route.path.startsWith('/admin')) {
      sections.admin.push(route);
    } else if (route.path.startsWith('/auth')) {
      sections.auth.push(route);
    } else {
      sections.user.push(route);
    }
  });

  return sections;
}

function generateMarkdown(routes: Record<string, RouteInfo[]>, components: ComponentInfo[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  let markdown = `# TEN Platform Sitemap\n\n`;
  markdown += `> Auto-generated on ${timestamp}\n\n`;

  // Add Routes
  markdown += `## Routes\n\n`;
  Object.entries(routes).forEach(([section, sectionRoutes]) => {
    markdown += `### ${section.charAt(0).toUpperCase() + section.slice(1)} Routes\n\n`;
    sectionRoutes.forEach(route => {
      const component = components.find(c => c.name === route.component);
      markdown += `- \`${route.path}\` - ${component?.name || route.component}\n`;
      if (component?.description) {
        markdown += `  - ${component.description}\n`;
      }
    });
    markdown += '\n';
  });

  // Add Components
  markdown += `## Components\n\n`;
  components
    .filter(component => !component.name.endsWith('Page'))
    .forEach(component => {
      markdown += `### ${component.name}\n`;
      markdown += `- File: \`${component.filePath}\`\n`;
      if (component.description) {
        markdown += `- Description: ${component.description}\n`;
      }
      markdown += '\n';
    });

  return markdown;
}

async function main() {
  try {
    // Find all TSX files in the client/src directory
    const clientSrcDir = path.join(ROOT_DIR, 'client/src');
    const files = await scanDirectory(clientSrcDir);

    // Extract routes and component information
    const routesPromises = files.map(extractRouteInfo);
    const componentsPromises = files.map(extractComponentInfo);

    const routesArrays = await Promise.all(routesPromises);
    const componentsArray = await Promise.all(componentsPromises);

    // Flatten routes and filter null components
    const routes = routesArrays.flat();
    const components = componentsArray.filter((c): c is ComponentInfo => c !== null);

    // Group routes by section
    const groupedRoutes = groupRoutesBySection(routes);

    // Generate markdown
    const markdown = generateMarkdown(groupedRoutes, components);

    // Write to file
    await fs.writeFile(path.join(ROOT_DIR, 'SITEMAP.md'), markdown);
    console.log('Sitemap generated successfully!');
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
