import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const projectId = "q4jWj4DH9RMtzQHbscytSd";
export const projectApiToken = "ZpPxAV5JDH0DhaFUvYJi0xGWSrQLcCwIVjUbYDhH9YTowlQI02ftlYQje1ChyzNRFSWnfu4TTYqrHm6QHQ";
export const host = "https://builder.yurekai.com";
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: projectId,
      token: projectApiToken,
    },
  ],
  host,
  // By default Builder YurekAI will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // project, allowing you to see your designs without publishing.  Please
  // only use this for development, as this is significantly slower.
  preview: false,
});
