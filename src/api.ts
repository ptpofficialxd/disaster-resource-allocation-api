import { Hono } from "hono";
import redisClient from "./redisClient";

const app = new Hono();

// Interface definitions
interface Area {
    AreaID: string; // Unique identifier for the area
    UrgencyLevel: number; // Urgency level from 1 to 5
    RequiredResources: Record<string, number>; // Resources needed for the area
    TimeConstraint: number; // Time within which resources must be delivered
}

interface Truck {
    TruckID: string; // Unique identifier for the truck
    AvailableResources: Record<string, number>; // Resources available in the truck
    TravelTimeToArea: Record<string, number>; // Travel times to areas
}

// Middleware for input validation
const validateArrayInput = (type: string) => {
    return async (c: any, next: () => Promise<void>) => {
        const data = await c.req.json();
        if (!Array.isArray(data)) {
            return c.json(
                { message: `Invalid input, expected an array of ${type}` },
                400
            );
        }
        await next();
    };
};

// Welcome message endpoint
app.get("/", async (c) => {
    return c.json({ message: "Disaster Resource Allocation API" });
});

/* POST /api/areas */
// Allows adding affected areas, with details such as urgency level, resources needed, and time constraints
app.post("/api/areas", validateArrayInput("areas"), async (c) => {
    const areas: Area[] = await c.req.json();
    // Check for duplicate AreaID in the request (unique identifier for each area)
    const areaIDs = new Set<string>();
    for (const area of areas) {
        if (areaIDs.has(area.AreaID)) {
            return c.json(
                { message: `Duplicate AreaID: ${area.AreaID} found in the request` },
                400
            );
        }
        areaIDs.add(area.AreaID);
    }
    // Validate Urgency Level
    for (const area of areas) {
        if (area.UrgencyLevel < 1 || area.UrgencyLevel > 5) {
            return c.json({ message: "Urgency Level must be between 1 and 5" }, 400);
        }
    }
    // Store areas in Redis
    await Promise.all(
        areas.map((area) =>
            redisClient.hset("areas", area.AreaID, JSON.stringify(area))
        )
    );
    return c.json({ message: "Areas added", areas });
});

/* POST /api/trucks */
// Allows adding resource trucks, with details about available resources and travel times to areas
app.post("/api/trucks", validateArrayInput("trucks"), async (c) => {
    const trucks: Truck[] = await c.req.json();
    // Check for duplicate TruckID in the request (unique identifier for each truck)
    const truckIDs = new Set<string>();
    for (const truck of trucks) {
        if (truckIDs.has(truck.TruckID)) {
            return c.json(
                { message: `Duplicate TruckID: ${truck.TruckID} found in the request` },
                400
            );
        }
        truckIDs.add(truck.TruckID);
    }
    // Store trucks in Redis
    await Promise.all(
        trucks.map((truck) =>
            redisClient.hset("trucks", truck.TruckID, JSON.stringify(truck))
        )
    );
    return c.json({ message: "Trucks added", trucks });
});

/* POST /api/assignments */
// Processes and returns truck assignments for each area based on urgency, time constraints, and available resources
app.post("/api/assignments", async (c) => {
    const areas = await redisClient.hgetall("areas");
    const trucks = await redisClient.hgetall("trucks");
    const assignments: any[] = [];
    const areaList = Object.values(areas).map((area) => JSON.parse(area));
    const truckList = Object.values(trucks).map((truck) => JSON.parse(truck));
    // Sort areas by Urgency Level (higher urgency first)
    areaList.sort((a, b) => b.UrgencyLevel - a.UrgencyLevel);
    for (const area of areaList) {
        const requiredResources = area.RequiredResources;
        const timeConstraint = area.TimeConstraint;
        let assigned = false;
        for (const truck of truckList) {
            const availableResources = truck.AvailableResources;
            const travelTime = truck.TravelTimeToArea[area.AreaID] || Infinity;
            let canDeliver = true;
            // Check if a truck can deliver the required resources
            for (const resource in requiredResources) {
                if (
                    !availableResources[resource] ||
                    availableResources[resource] < requiredResources[resource]
                ) {
                    canDeliver = false;
                    break;
                }
            }
            // Check travel time constraint
            if (canDeliver && travelTime <= timeConstraint) {
                assignments.push({
                    AreaID: area.AreaID,
                    TruckID: truck.TruckID,
                    ResourcesDelivered: requiredResources,
                });
                // Update truck's available resources
                const updatedTruck = {
                    ...truck,
                    AvailableResources: {
                        ...truck.AvailableResources,
                    },
                };
                for (const resource in requiredResources) {
                    updatedTruck.AvailableResources[resource] -=
                        requiredResources[resource];
                }
                await redisClient.hset(
                    "trucks",
                    truck.TruckID,
                    JSON.stringify(updatedTruck)
                );
                assigned = true;
                break;
            }
            // Handle the case where the truck cannot deliver due to time constraint
            if (travelTime > timeConstraint) {
                assignments.push({
                    AreaID: area.AreaID,
                    Error: `No available truck due to time constraint for Area ID: ${area.AreaID}`,
                });
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            // Handle the case where resources are insufficient
            const errorMessage = `No available truck or insufficient resources for Area ID: ${area.AreaID}`;
            assignments.push({
                AreaID: area.AreaID,
                Error: errorMessage,
            });
        }
    }
    // Store assignments in Redis with a 30-minute expiration time
    await redisClient.set("assignments", JSON.stringify(assignments), "EX", 1800);
    return c.json({ message: "Assignments processed", assignments });
});

/* GET /api/assignments */
// Returns the last processed assignments, retrieving them from a Redis cache if available
app.get("/api/assignments", async (c) => {
    const assignments = await redisClient.get("assignments");
    return c.json({
        message: "Assignments retrieved",
        assignments: JSON.parse(assignments || "[]"),
    });
});

/* DELETE /api/assignments */
// Clears the current assignment data from the cache
app.delete("/api/assignments", async (c) => {
    await redisClient.del("assignments");
    return c.json({ message: "Assignments cleared" });
});

// Error handling for Redis
redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

export default app;
