import Box from "@mui/material/Box";
import { LembreteConfirmacaoBlock } from "./LembreteConfirmacaoBlock";

type Props = {
  getAuthHeaders: () => Promise<Record<string, string>>;
};

export function WhatsappConfigSection({ getAuthHeaders }: Props) {
  return (
    <Box className="tabPanel" role="tabpanel" aria-label="Configuração de Bot">
      <LembreteConfirmacaoBlock getAuthHeaders={getAuthHeaders} />
    </Box>
  );
}
