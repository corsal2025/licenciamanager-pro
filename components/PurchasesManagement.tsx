import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { purchaseService } from '../services/purchaseService';
import { Purchase, PurchaseStatus, User, UserRole } from '../types';

interface PurchasesManagementProps {
    currentUser: User | null;
}

const PurchasesManagement: React.FC<PurchasesManagementProps> = ({ currentUser }) => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({ item: '', description: '', amount: '' });

    const loadPurchases = async () => {
        setLoading(true);
        try {
            const data = await purchaseService.getAll(showDeleted);
            setPurchases(data);
        } catch (error) {
            console.error("Error loading purchases:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPurchases();
    }, [showDeleted]);

    const handleCreate = async () => {
        if (!currentUser) return;
        try {
            await purchaseService.create({
                item: formData.item,
                description: formData.description,
                amount: Number(formData.amount) || 0
            }, currentUser.username);
            setOpenDialog(false);
            setFormData({ item: '', description: '', amount: '' });
            loadPurchases();
        } catch (error) {
            alert("Error creating purchase");
        }
    };

    const handleDelete = async (id: string, isDeleted: boolean) => {
        if (!currentUser) return;
        try {
            if (isDeleted) {
                // Restore
                await purchaseService.restore(id, currentUser.username);
            } else {
                // Soft Delete
                await purchaseService.delete(id, currentUser.username);
            }
            loadPurchases();
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: PurchaseStatus) => {
        if (!currentUser) return;
        try {
            await purchaseService.update(id, { status: newStatus }, currentUser.username);
            loadPurchases();
        } catch (error) {
            console.error(error);
        }
    }

    const getStatusColor = (status: PurchaseStatus) => {
        switch (status) {
            case PurchaseStatus.APPROVED: return 'success';
            case PurchaseStatus.PURCHASED: return 'info';
            case PurchaseStatus.REJECTED: return 'error';
            default: return 'warning';
        }
    };

    return (
        <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon color="primary" /> Gestión de Compras y Pedidos
                </Typography>
                <Box>
                    <Button
                        variant={showDeleted ? "contained" : "outlined"}
                        color="warning"
                        onClick={() => setShowDeleted(!showDeleted)}
                        sx={{ mr: 2 }}
                    >
                        {showDeleted ? "Ocultar Papelera" : "Ver Papelera"}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Nuevo Pedido
                    </Button>
                </Box>
            </Stack>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Item</strong></TableCell>
                            <TableCell><strong>Descripción</strong></TableCell>
                            <TableCell><strong>Monto Estimado</strong></TableCell>
                            <TableCell><strong>Solicitado Por</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell align="right"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {purchases.map((p) => (
                            <TableRow key={p.id} sx={{ opacity: p.isDeleted ? 0.5 : 1, bgcolor: p.isDeleted ? '#ffebee' : 'inherit' }}>
                                <TableCell>{new Date(p.requestDate * 1000).toLocaleDateString()}</TableCell>
                                <TableCell>{p.item}</TableCell>
                                <TableCell>{p.description}</TableCell>
                                <TableCell>${p.amount?.toLocaleString()}</TableCell>
                                <TableCell>{p.requestedBy}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={p.status}
                                        color={getStatusColor(p.status)}
                                        size="small"
                                        onClick={() => {
                                            // Only Admin can change status
                                            if (currentUser?.role === UserRole.ADMIN && !p.isDeleted) {
                                                const next = p.status === PurchaseStatus.PENDING ? PurchaseStatus.APPROVED
                                                    : p.status === PurchaseStatus.APPROVED ? PurchaseStatus.PURCHASED
                                                        : PurchaseStatus.PENDING; // Cycle
                                                handleStatusChange(p.id, next);
                                            } else {
                                                alert("Solo el Administrador puede cambiar el estado.");
                                            }
                                        }}
                                        sx={{
                                            cursor: currentUser?.role === UserRole.ADMIN ? 'pointer' : 'not-allowed',
                                            opacity: currentUser?.role === UserRole.ADMIN ? 1 : 0.8
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        color={p.isDeleted ? "success" : "error"}
                                        onClick={() => handleDelete(p.id, !!p.isDeleted)}
                                    >
                                        {p.isDeleted ? <RestoreFromTrashIcon /> : <DeleteIcon />}
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {purchases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">No hay registros</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* CREATE DIALOG */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Nuevo Pedido de Compra</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Item / Producto"
                            fullWidth
                            value={formData.item}
                            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                        />
                        <TextField
                            label="Descripción / Justificación"
                            fullWidth
                            multiline rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            label="Monto Estimado (Opcional)"
                            type="number"
                            fullWidth
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} variant="contained">Crear Solicitud</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchasesManagement;
