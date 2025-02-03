import {
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

interface TimeBlockTemplate {
  title: string;
  startHour: number;
  duration: number;
  days?: number[]; // Optional: specify which days this block appears (0-4 for Mon-Fri)
}

const DEMO_WORKSPACES = [
  {
    name: "Personal Development",
    projects: ["Daily Habits Tracking", "Reading List"],
  },
  {
    name: "Work Projects",
    projects: ["Q4 Marketing Campaign", "Product Launch Plan"],
  },
  {
    name: "Home Management",
    projects: ["Weekly House Cleaning", "Renovation Plan"],
  },
  {
    name: "Study & Learning",
    projects: ["Online Course Completion", "Language Learning"],
  },
  {
    name: "Family & Friends",
    projects: ["Family Vacation Planning", "Holiday Season Preparation"],
  },
] as const;

// Task categories for marketing campaign
const TASK_CATEGORIES = [
  "Planning",
  "Research",
  "Content",
  "Design",
  "Analytics",
] as const;

type Priority = 10 | 8 | 6 | 4 | 2;

interface MarketingTask {
  title: string;
  priority: Priority;
  category: (typeof TASK_CATEGORIES)[number];
}

const TIME_BLOCK_COLORS = [
  "hsl(20, 60%, 70%)", // Brightened Warm Sand
  "hsl(220, 60%, 70%)", // Brightened Soft Blue
  "hsl(100, 50%, 70%)", // Brightened Sage Green
  "hsl(340, 60%, 70%)", // Brightened Dusty Rose
  "hsl(270, 60%, 70%)", // Brightened Lavender
] as const;

const MARKETING_CAMPAIGN_TASKS: MarketingTask[] = [
  {
    title: "Define Campaign Objectives",
    priority: 10,
    category: "Planning",
  },
  { title: "Conduct Market Research", priority: 10, category: "Research" },
  { title: "Identify Target Audience", priority: 10, category: "Research" },
  {
    title: "Develop Campaign Messaging",
    priority: 6,
    category: "Content",
  },
  {
    title: "Design Promotional Materials",
    priority: 6,
    category: "Design",
  },
  { title: "Set Campaign Budget", priority: 10, category: "Planning" },
  {
    title: "Choose Marketing Channels",
    priority: 6,
    category: "Planning",
  },
  {
    title: "Schedule Campaign Activities",
    priority: 6,
    category: "Planning",
  },
  {
    title: "Develop Social Media Strategy",
    priority: 10,
    category: "Content",
  },
  {
    title: "Launch Initial Advertising",
    priority: 6,
    category: "Content",
  },
  {
    title: "Monitor Campaign Performance",
    priority: 6,
    category: "Analytics",
  },
  {
    title: "Adjust Strategies Based on Feedback",
    priority: 2,
    category: "Analytics",
  },
  {
    title: "Collaborate with Influencers",
    priority: 2,
    category: "Content",
  },
  {
    title: "Execute Email Marketing Campaign",
    priority: 6,
    category: "Content",
  },
  { title: "Prepare Campaign Report", priority: 2, category: "Analytics" },
];

interface RenovationTask {
  title: string;
  priority: string;
  status: string;
  subtasks?: RenovationTask[];
}

const RENOVATION_TASKS: RenovationTask[] = [
  // Main planning tasks
  {
    title: "Overall Renovation Planning",
    priority: "10",
    status: "open",
    subtasks: [
      {
        title: "Budget Planning",
        priority: "8",
        status: "open",
        subtasks: [
          { title: "Get Contractor Quotes", priority: "6", status: "open" },
          { title: "Research Material Costs", priority: "6", status: "open" },
          { title: "Create Contingency Fund", priority: "4", status: "open" },
        ],
      },
      {
        title: "Timeline Development",
        priority: "8",
        status: "open",
        subtasks: [
          { title: "Create Project Schedule", priority: "6", status: "open" },
          { title: "Identify Project Phases", priority: "6", status: "open" },
        ],
      },
    ],
  },

  // Kitchen renovation branch
  {
    title: "Kitchen Renovation",
    priority: "10",
    status: "open",
    subtasks: [
      {
        title: "Cabinet Selection",
        priority: "8",
        status: "open",
        subtasks: [
          { title: "Choose Cabinet Style", priority: "6", status: "open" },
          { title: "Measure Cabinet Spaces", priority: "6", status: "open" },
        ],
      },
      {
        title: "Appliance Selection",
        priority: "8",
        status: "open",
        subtasks: [
          {
            title: "Research Energy Efficient Options",
            priority: "6",
            status: "open",
          },
          {
            title: "Compare Appliance Features",
            priority: "6",
            status: "open",
          },
        ],
      },
    ],
  },
];

const TIME_BLOCK_TEMPLATES: TimeBlockTemplate[] = [
  { title: "Team Standup", startHour: 9, duration: 30, days: [0, 2, 4] }, // Mon, Wed, Fri
  { title: "Client Meetings", startHour: 10, duration: 90, days: [1, 3] }, // Tue, Thu
  { title: "Focus Time", startHour: 10, duration: 120, days: [0, 2, 4] }, // Mon, Wed, Fri
  { title: "Lunch Break", startHour: 12, duration: 60 }, // Every day
  { title: "Design Review", startHour: 13, duration: 90, days: [1] }, // Tuesday
  { title: "Sprint Planning", startHour: 13, duration: 120, days: [0] }, // Monday
  { title: "Team Collaboration", startHour: 14, duration: 120, days: [2, 4] }, // Wed, Fri
  { title: "1:1 Meetings", startHour: 15, duration: 60, days: [3] }, // Thursday
  { title: "Weekly Retrospective", startHour: 16, duration: 60, days: [4] }, // Friday
  { title: "Learning Time", startHour: 16, duration: 60, days: [1, 3] }, // Tue, Thu
];

export const demoRouter = createTRPCRouter({
  seedDemoData: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Create workspaces and projects
    for (const workspace of DEMO_WORKSPACES) {
      const createdWorkspace = await ctx.db.workspace.create({
        data: {
          name: workspace.name,
          userId,
        },
      });

      // Create projects for this workspace
      for (const projectName of workspace.projects) {
        await ctx.db.project.create({
          data: {
            name: projectName,
            userId,
            workspaceId: createdWorkspace.id,
          },
        });
      }
    }

    // Find the "Work Projects" workspace and "Q4 Marketing Campaign" project
    const workProjectsWorkspace = await ctx.db.workspace.findFirst({
      where: {
        name: "Work Projects",
        userId,
      },
    });

    // Find the "Home Management" workspace and "Renovation Plan" project
    const homeWorkspace = await ctx.db.workspace.findFirst({
      where: {
        name: "Home Management",
        userId,
      },
    });

    if (workProjectsWorkspace) {
      const marketingProject = await ctx.db.project.findFirst({
        where: {
          name: "Q4 Marketing Campaign",
          workspaceId: workProjectsWorkspace.id,
        },
      });

      if (marketingProject) {
        // Create the marketing campaign tasks with priorities and categories
        await ctx.db.task.createMany({
          data: MARKETING_CAMPAIGN_TASKS.map((task) => ({
            title: task.title,
            status: "open",
            userId,
            projectId: marketingProject.id,
            priority: task.priority.toString(),
            category: task.category,
          })),
        });

        // Create time blocks for the week
        const today = new Date();
        const weekStart = startOfWeek(today);

        // Create time blocks for each day of the work week (Monday to Friday)
        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
          const currentDay = addDays(weekStart, dayOffset);

          // Filter templates for this day
          const todayTemplates = TIME_BLOCK_TEMPLATES.filter(
            (template) => !template.days || template.days.includes(dayOffset),
          );

          for (
            let blockIndex = 0;
            blockIndex < todayTemplates.length;
            blockIndex++
          ) {
            const template = todayTemplates[blockIndex];
            if (!template) {
              continue;
            }

            const colorIndex = blockIndex % TIME_BLOCK_COLORS.length;

            const startTime = setMinutes(
              setHours(currentDay, template.startHour),
              0,
            );
            const endTime = addMinutes(startTime, template.duration);

            await ctx.db.timeBlock.create({
              data: {
                workspaceId: workProjectsWorkspace.id,
                title: template.title,
                startTime,
                endTime,
                color: TIME_BLOCK_COLORS[colorIndex],
              },
            });
          }
        }
      }
    }

    if (homeWorkspace) {
      const renovationProject = await ctx.db.project.findFirst({
        where: {
          name: "Renovation Plan",
          workspaceId: homeWorkspace.id,
        },
      });

      if (renovationProject) {
        // Helper function to create tasks recursively
        const createTaskWithSubtasks = async (
          taskData: RenovationTask,
          parentTaskId?: number,
        ) => {
          const createdTask = await ctx.db.task.create({
            data: {
              title: taskData.title,
              status: taskData.status,
              priority: taskData.priority,
              userId,
              projectId: renovationProject.id,
              parentTaskId,
            },
          });

          if (taskData.subtasks) {
            for (const subtask of taskData.subtasks) {
              await createTaskWithSubtasks(subtask, createdTask.task_id);
            }
          }

          return createdTask;
        };

        // Create all renovation tasks with their hierarchical structure
        for (const task of RENOVATION_TASKS) {
          await createTaskWithSubtasks(task);
        }
      }
    }

    return { success: true, message: "Demo data seeded successfully" };
  }),
});
