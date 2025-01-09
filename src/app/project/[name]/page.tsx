import { TaskList } from "~/app/_components/TaskList";

export default function ProjectPage({ params }: { params: { name: string } }) {
  return <TaskList projectName={params.name} />;
}
