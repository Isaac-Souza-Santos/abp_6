import DownloadIcon from "@mui/icons-material/Download";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { statusOptions, rotuloStatus } from "../constants/status";
import type { StatusAgendamento } from "../types/painel";

type Props = {
  searchTerm: string;
  statusFilter: StatusAgendamento | "todos";
  dateFilter: string;
  exportDisabled?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusAgendamento | "todos") => void;
  onDateChange: (value: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
};

export function FiltersBar({
  searchTerm,
  statusFilter,
  dateFilter,
  exportDisabled = false,
  onSearchChange,
  onStatusChange,
  onDateChange,
  onExportCsv,
  onExportJson,
}: Props) {
  return (
    <Card aria-label="Filtros da lista">
      <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              type="search"
              label="Pesquisar"
              placeholder="Nome, telefone, protocolo…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filtro-status">Status</InputLabel>
              <Select
                labelId="filtro-status"
                label="Status"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value as StatusAgendamento | "todos")}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {rotuloStatus[status]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <TextField
              fullWidth
              type="date"
              label="Data"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Stack direction="row" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <ButtonGroup size="small" variant="outlined" disabled={exportDisabled}>
                <Button startIcon={<DownloadIcon fontSize="small" />} onClick={onExportCsv}>
                  CSV
                </Button>
                <Button onClick={onExportJson}>JSON</Button>
              </ButtonGroup>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
