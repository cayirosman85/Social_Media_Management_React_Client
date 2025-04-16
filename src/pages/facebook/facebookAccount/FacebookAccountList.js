import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  TablePagination,
  Checkbox,
  Tooltip,
  TableSortLabel,
  Skeleton,
} from '@mui/material';
import { Edit, Delete, Refresh, Search, Clear, DeleteSweep } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiFetch } from '../../../api/facebook/api';
import { format } from 'date-fns'; // For date formatting

const FacebookAccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]); // For bulk delete
  const [sortConfig, setSortConfig] = useState({ key: 'facebookAppName', direction: 'asc' });
  const navigate = useNavigate();
  const context = useOutletContext();
  const setErrorModalMessage = context?.setErrorModalMessage;

  // Debug context
  useEffect(() => {
    console.log('Outlet Context:', context);
    if (!setErrorModalMessage) {
      console.warn('setErrorModalMessage is not available. Using local error state.');
    }
  }, [context, setErrorModalMessage]);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/FacebookAccount');
      console.log('Fetched Accounts:', data);
      setAccounts(data);
      setFilteredAccounts(data);
      setError('');
    } catch (err) {
      const errorMessage = err.message || 'Hesaplar alınamadı';
      setError(errorMessage);
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [setErrorModalMessage]);

  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle search filtering
  useEffect(() => {
    const filtered = accounts.filter((account) =>
      account.facebookAppName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAccounts(filtered);
    setPage(0); // Reset to first page on search
  }, [searchQuery, accounts]);

  // Handle sorting
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    const sorted = [...filteredAccounts].sort((a, b) => {
      const aValue = a[key] || '';
      const bValue = b[key] || '';
      if (key === 'longLiveAccessTokenCreatedAt') {
        const aDate = aValue ? new Date(aValue) : new Date(0);
        const bDate = bValue ? new Date(bValue) : new Date(0);
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    setFilteredAccounts(sorted);
  };

  // Handle single delete
  const handleDelete = useCallback(
    async (companyId) => {
      if (!window.confirm('Bu hesabı silmek istediğinizden emin misiniz?')) return;

      try {
        await apiFetch(`/api/FacebookAccount/${companyId}`, { method: 'DELETE' });
        setAccounts((prev) => prev.filter((account) => account.companyId !== companyId));
        setFilteredAccounts((prev) =>
          prev.filter((account) => account.companyId !== companyId)
        );
        setSelected((prev) => prev.filter((id) => id !== companyId));
        const successMessage = 'Hesap başarıyla silindi';
        setError('');
        if (setErrorModalMessage) {
          setErrorModalMessage(successMessage);
        } else {
          setError(successMessage);
        }
      } catch (err) {
        const errorMessage = err.message || 'Hesap silinemedi';
        setError(errorMessage);
        if (setErrorModalMessage) {
          setErrorModalMessage(errorMessage);
        }
      }
    },
    [setErrorModalMessage]
  );

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`${selected.length} hesabı silmek istediğinizden emin misiniz?`))
      return;

    try {
      await Promise.all(
        selected.map((id) =>
          apiFetch(`/api/FacebookAccount/${id}`, { method: 'DELETE' })
        )
      );
      setAccounts((prev) => prev.filter((account) => !selected.includes(account.companyId)));
      setFilteredAccounts((prev) =>
        prev.filter((account) => !selected.includes(account.companyId))
      );
      setSelected([]);
      const successMessage = `${selected.length} hesap başarıyla silindi`;
      setError('');
      if (setErrorModalMessage) {
        setErrorModalMessage(successMessage);
      } else {
        setError(successMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'Hesaplar silinemedi';
      setError(errorMessage);
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle checkbox selection
  const handleSelect = (companyId) => {
    setSelected((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const currentPageIds = filteredAccounts
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((account) => account.companyId);
      setSelected(currentPageIds);
    } else {
      setSelected([]);
    }
  };

  // Memoized table rows
  const tableRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAccounts.slice(start, end).map((account) => (
      <TableRow
        key={account.companyId}
        sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected.includes(account.companyId)}
            onChange={() => handleSelect(account.companyId)}
          />
        </TableCell>
        <TableCell>{account.facebookAppName}</TableCell>
        <TableCell>{account.facebookAppId}</TableCell>
        <TableCell>{account.companyId}</TableCell>
        <TableCell>
          {account.longLiveAccessTokenCreatedAt
            ? format(new Date(account.longLiveAccessTokenCreatedAt), 'dd.MM.yyyy')
            : '-'}
        </TableCell>
        <TableCell>{account.graphApiVersion || '-'}</TableCell>
        <TableCell align="right">
          <Tooltip title="Hesabı Düzenle">
            <IconButton
              color="primary"
              onClick={() => navigate(`/facebook-accounts/edit/${account.companyId}`)}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hesabı Sil">
            <IconButton color="error" onClick={() => handleDelete(account.companyId)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    ));
  }, [filteredAccounts, page, rowsPerPage, selected, navigate, handleDelete]);

  return (
    <Box sx={{ mt: 4, p: 3, maxWidth: '1400px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Facebook Hesapları
      </Typography>

      {/* Action Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Edit />}
            onClick={() => navigate('/facebook-accounts/create')}
            sx={{ fontSize: '1rem', py: 1 }}
          >
            Yeni Hesap Ekle
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Refresh />}
            onClick={fetchAccounts}
            disabled={loading}
            sx={{ fontSize: '1rem', py: 1 }}
          >
            Yenile
          </Button>
          {selected.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={handleBulkDelete}
              sx={{ fontSize: '1rem', py: 1 }}
            >
              {`${selected.length} Hesabı Sil`}
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Hesap Ara"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: '350px' }, fontSize: '1.1rem' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          {searchQuery && (
            <Tooltip title="Aramayı Temizle">
              <IconButton onClick={handleClearSearch}>
                <Clear />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Error Display */}
      {error && !setErrorModalMessage && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={fetchAccounts}
            disabled={loading}
          >
            Yeniden Dene
          </Button>
        </Box>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} />
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>App Adı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>App ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Şirket ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Jeton Tarihi</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Graph API</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  İşlemler
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="rectangular" width={40} height={40} /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={80} height={40} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      filteredAccounts.length > 0 &&
                      selected.length ===
                        filteredAccounts.slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        ).length
                    }
                    onChange={handleSelectAll}
                    indeterminate={
                      selected.length > 0 &&
                      selected.length <
                        filteredAccounts.slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        ).length
                    }
                  />
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'facebookAppName'}
                    direction={sortConfig.key === 'facebookAppName' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('facebookAppName')}
                  >
                    App Adı
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'facebookAppId'}
                    direction={sortConfig.key === 'facebookAppId' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('facebookAppId')}
                  >
                    App ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'companyId'}
                    direction={sortConfig.key === 'companyId' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('companyId')}
                  >
                    Şirket ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'longLiveAccessTokenCreatedAt'}
                    direction={
                      sortConfig.key === 'longLiveAccessTokenCreatedAt'
                        ? sortConfig.direction
                        : 'asc'
                    }
                    onClick={() => handleSort('longLiveAccessTokenCreatedAt')}
                  >
                    Jeton Tarihi
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'graphApiVersion'}
                    direction={sortConfig.key === 'graphApiVersion' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('graphApiVersion')}
                  >
                    Graph API
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}
                  align="right"
                >
                  İşlemler
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 4 }}>
                      {searchQuery ? 'Aramanıza uygun hesap bulunamadı' : 'Hiç hesap bulunamadı'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tableRows
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredAccounts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default FacebookAccountList;