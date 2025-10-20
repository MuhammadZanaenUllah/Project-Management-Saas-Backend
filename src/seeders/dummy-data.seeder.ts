import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import { RolePermissions } from "../utils/role-permission";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { ProviderEnum } from "../enums/account-provider.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

const seedDummyData = async () => {
  console.log("Seeding dummy data started...");
  try {
    await connectDatabase();

    // Ensure roles exist (OWNER, ADMIN, MEMBER)
    const requiredRoles = [Roles.OWNER, Roles.ADMIN, Roles.MEMBER];
    let roles = await RoleModel.find({ name: { $in: requiredRoles } });
    if (roles.length !== requiredRoles.length) {
      console.log("Seeding missing roles...");
      for (const roleName of requiredRoles) {
        const exists = roles.find((r) => r.name === roleName);
        if (!exists) {
          await new RoleModel({
            name: roleName,
            permissions: RolePermissions[roleName as keyof typeof RolePermissions],
          }).save();
          console.log(`Role ${roleName} added.`);
        }
      }
      roles = await RoleModel.find({ name: { $in: requiredRoles } });
    }
    const existingRoleNames = new Set(roles.map((r) => r.name));
    if (existingRoleNames.size !== requiredRoles.length) {
      console.log("Roles missing. Please run 'npm run seed' to seed roles first.");
      throw new Error("Required roles are missing");
    }

    console.log("Clearing existing domain data (users, workspaces, projects, tasks, members, accounts)...");
    await TaskModel.deleteMany({});
    await ProjectModel.deleteMany({});
    await MemberModel.deleteMany({});
    await WorkspaceModel.deleteMany({});
    await AccountModel.deleteMany({});
    await UserModel.deleteMany({});

    // Create Users
    console.log("Creating users...");
    const owner = new UserModel({
      name: "Alice Owner",
      email: "owner@example.com",
      password: "Passw0rd!",
      profilePicture: null,
    });
    const admin = new UserModel({
      name: "Bob Admin",
      email: "admin@example.com",
      password: "Passw0rd!",
      profilePicture: null,
    });
    const member = new UserModel({
      name: "Charlie Member",
      email: "member@example.com",
      password: "Passw0rd!",
      profilePicture: null,
    });

    await owner.save();
    await admin.save();
    await member.save();

    console.log("Creating accounts for users...");
    await new AccountModel({ userId: owner._id, provider: ProviderEnum.EMAIL, providerId: owner.email }).save();
    await new AccountModel({ userId: admin._id, provider: ProviderEnum.EMAIL, providerId: admin.email }).save();
    await new AccountModel({ userId: member._id, provider: ProviderEnum.EMAIL, providerId: member.email }).save();

    // Create Workspace owned by Alice
    console.log("Creating workspace...");
    const workspace = new WorkspaceModel({
      name: "Acme Workspace",
      description: "Sample workspace for demo and testing",
      owner: owner._id,
    });
    await workspace.save();

    const ownerRole = roles.find((r) => r.name === Roles.OWNER)!;
    const adminRole = roles.find((r) => r.name === Roles.ADMIN)!;
    const memberRole = roles.find((r) => r.name === Roles.MEMBER)!;

    console.log("Adding members to workspace...");
    await new MemberModel({ userId: owner._id, workspaceId: workspace._id, role: ownerRole._id, joinedAt: new Date() }).save();
    await new MemberModel({ userId: admin._id, workspaceId: workspace._id, role: adminRole._id, joinedAt: new Date() }).save();
    await new MemberModel({ userId: member._id, workspaceId: workspace._id, role: memberRole._id, joinedAt: new Date() }).save();

    // Set currentWorkspace for users
    owner.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    admin.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    member.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    await owner.save();
    await admin.save();
    await member.save();

    // Create Projects
    console.log("Creating projects...");
    const websiteProject = new ProjectModel({
      name: "Website Redesign",
      description: "Revamp marketing site UI/UX",
      emoji: "🎨",
      workspace: workspace._id,
      createdBy: owner._id,
    });
    const mobileProject = new ProjectModel({
      name: "Mobile App",
      description: "Ship MVP for iOS/Android",
      emoji: "📱",
      workspace: workspace._id,
      createdBy: admin._id,
    });
    await websiteProject.save();
    await mobileProject.save();

    // Create Tasks for projects
    console.log("Creating tasks...");
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = [
      new TaskModel({
        title: "Design new landing page",
        description: "Create wireframes and high-fidelity mockups",
        priority: TaskPriorityEnum.HIGH,
        status: TaskStatusEnum.IN_PROGRESS,
        assignedTo: owner._id,
        createdBy: owner._id,
        workspace: workspace._id,
        project: websiteProject._id,
        dueDate: nextWeek,
      }),
      new TaskModel({
        title: "Refactor CSS architecture",
        description: "Adopt CSS Modules and cleanup globals",
        priority: TaskPriorityEnum.MEDIUM,
        status: TaskStatusEnum.TODO,
        assignedTo: admin._id,
        createdBy: owner._id,
        workspace: workspace._id,
        project: websiteProject._id,
        dueDate: nextWeek,
      }),
      new TaskModel({
        title: "Implement login flow",
        description: "OAuth and email/password support",
        priority: TaskPriorityEnum.HIGH,
        status: TaskStatusEnum.IN_REVIEW,
        assignedTo: member._id,
        createdBy: admin._id,
        workspace: workspace._id,
        project: mobileProject._id,
        dueDate: twoDaysAgo, // overdue
      }),
      new TaskModel({
        title: "Fix push notifications",
        description: "Investigate FCM/APNS issues",
        priority: TaskPriorityEnum.LOW,
        status: TaskStatusEnum.DONE,
        assignedTo: null,
        createdBy: admin._id,
        workspace: workspace._id,
        project: mobileProject._id,
        dueDate: now,
      }),
    ];

    await TaskModel.insertMany(tasks);

    console.log("Dummy data seeded successfully.");
    console.log({
      users: 3,
      workspace: workspace.name,
      projects: 2,
      tasks: tasks.length,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error during dummy data seeding:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDummyData();