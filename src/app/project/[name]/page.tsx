import { TaskList } from "~/app/_components/TaskList";

export default async function ProjectPage(props: {
  params: Promise<{ name: string }>;
}) {
  const params = await props.params;
  return <TaskList projectName={decodeURIComponent(params.name)} />;
}
