import React, { useState, useEffect } from 'react'
import { Table, Space, Button, Modal, Tag, Statistic, Row, Col, Card, Empty, Spin } from 'antd'
import { DeleteOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons'
import ApiManager from '../../../api/ApiManager'
import { PortInfo, PortManagementStats } from '../../../models/Port'

/**
 * Port Dashboard - Real-time visualization of all ports in use
 * Shows containers, services, and system processes using ports
 */

interface PortDashboardState {
    ports: PortInfo[]
    stats: PortManagementStats | null
    loading: boolean
    error: string | null
}

const PortDashboard: React.FC = () => {
    const [state, setState] = useState<PortDashboardState>({
        ports: [],
        stats: null,
        loading: true,
        error: null,
    })

    const fetchPortData = async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }))

            const [portsRes, statsRes] = await Promise.all([
                ApiManager.get('/user/ports/scan'),
                ApiManager.get('/user/ports/stats'),
            ])

            setState({
                ports: portsRes.data?.ports || [],
                stats: statsRes.data?.stats || null,
                loading: false,
                error: null,
            })
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to fetch port data',
            }))
        }
    }

    useEffect(() => {
        fetchPortData()
        const interval = setInterval(fetchPortData, 60000) // Refresh every 60s
        return () => clearInterval(interval)
    }, [])

    const handleStopContainer = async (containerId: string) => {
        Modal.confirm({
            title: 'Stop Container',
            content: 'Are you sure you want to stop this container?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await ApiManager.post('/user/ports/stop-container', {
                        containerId,
                    })
                    fetchPortData()
                } catch (error) {
                    Modal.error({ title: 'Error', content: 'Failed to stop container' })
                }
            },
        })
    }

    const handleKillProcess = async (pid: number) => {
        Modal.confirm({
            title: 'Kill Process',
            content: 'Are you sure you want to kill this process?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await ApiManager.post('/user/ports/kill', { pid })
                    fetchPortData()
                } catch (error) {
                    Modal.error({ title: 'Error', content: 'Failed to kill process' })
                }
            },
        })
    }

    const columns = [
        {
            title: 'Port',
            dataIndex: 'port',
            key: 'port',
            sorter: (a: PortInfo, b: PortInfo) => a.port - b.port,
            width: 100,
        },
        {
            title: 'Protocol',
            dataIndex: 'protocol',
            key: 'protocol',
            render: (protocol: string) => (
                <Tag color={protocol === 'tcp' ? 'blue' : 'orange'}>{protocol.toUpperCase()}</Tag>
            ),
            width: 100,
        },
        {
            title: 'Service',
            key: 'service',
            render: (_: any, record: PortInfo) => {
                if (record.container) {
                    return (
                        <div>
                            <div>
                                <strong>Container:</strong> {record.container.name}
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#666' }}>
                                {record.container.appName}
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#999' }}>
                                {record.container.image}
                            </div>
                        </div>
                    )
                } else if (record.process) {
                    return (
                        <div>
                            <div>
                                <strong>Process:</strong> {record.process.name} (PID: {record.process.pid})
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#666' }}>
                                User: {record.process.user} | CPU: {record.process.cpu.toFixed(1)}% | Mem:{' '}
                                {record.process.memory.toFixed(1)}%
                            </div>
                        </div>
                    )
                }
                return 'Unknown'
            },
            flex: 1,
        },
        {
            title: 'Status',
            dataIndex: 'state',
            key: 'state',
            render: (state: string) => (
                <Tag color={state === 'open' ? 'green' : 'red'}>{state.toUpperCase()}</Tag>
            ),
            width: 100,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: PortInfo) => (
                <Space>
                    {record.container && (
                        <Button
                            danger
                            size=\"small\"
                            icon={<StopOutlined />}
                            onClick={() => handleStopContainer(record.container!.id)}
                        >
                            Stop
                        </Button>
                    )}
                    {record.process && (
                        <Button
                            danger
                            size=\"small\"
                            icon={<DeleteOutlined />}
                            onClick={() => handleKillProcess(record.process!.pid)}
                        >
                            Kill
                        </Button>
                    )}
                </Space>
            ),
            width: 150,
        },
    ]

    if (state.loading && !state.ports.length) {
        return <Spin />
    }

    return (
        <div style={{ padding: '24px' }}>
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={16} justify=\"space-between\" align=\"middle\">
                    <Col>
                        <h2 style={{ margin: 0 }}>Port Management Dashboard</h2>
                    </Col>
                    <Col>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchPortData}
                            loading={state.loading}
                        >
                            Refresh
                        </Button>
                    </Col>
                </Row>
            </Card>

            {state.stats && (
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title=\"Used Ports\"
                                value={state.stats.usedPorts}
                                suffix={`/ ${state.stats.totalPorts}`}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title=\"Available Ports\"
                                value={state.stats.availablePorts}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title=\"Container Ports\"
                                value={state.stats.containerPorts}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title=\"System Processes\"
                                value={state.stats.systemPorts}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card>
                {state.error && (
                    <div style={{ color: 'red', marginBottom: '16px' }}>
                        Error: {state.error}
                    </div>
                )}

                {state.ports.length === 0 ? (
                    <Empty description=\"No ports in use\" />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={state.ports}
                        rowKey={(record) => `${record.port}-${record.protocol}`}
                        pagination={{ pageSize: 20 }}
                        loading={state.loading}
                        size=\"small\"
                    />
                )}
            </Card>

            <div style={{ marginTop: '24px', fontSize: '0.85em', color: '#666' }}>
                <p>
                    Last updated: {state.stats?.lastScan ? new Date(state.stats.lastScan).toLocaleString() : 'N/A'}
                </p>
                <p>
                    💡 Tip: Ports are cached for 60 seconds. For real-time updates, click Refresh.
                </p>
            </div>
        </div>
    )
}

export default PortDashboard
