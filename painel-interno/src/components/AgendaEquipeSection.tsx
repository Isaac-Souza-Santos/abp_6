import Box from "@mui/material/Box";
import { AtendentesAgendaConfigEditor } from "./AtendentesAgendaConfigEditor";

type Props = {
  getAuthHeaders: () => Promise<Record<string, string>>;
};

export function AgendaEquipeSection({ getAuthHeaders }: Props) {
  return (
    <Box className="tabPanel" role="tabpanel" aria-label="Equipe e horários">
      <AtendentesAgendaConfigEditor getAuthHeaders={getAuthHeaders} />
    </Box>
  );
}
