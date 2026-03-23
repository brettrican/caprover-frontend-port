export interface PortInfo {
    port: number
    protocol: 'tcp' | 'udp'
    state: 'open' | 'closed' | 'filtered'
    process?: {
        pid: number
        name: string
        command: string
        user: string
        cpu: number
        memory: number
    }
    container?: {
        id: string
        name: string
        image: string
        status: string
        appName?: string
    }
    timestamp: string
}

export interface PortManagementStats {
    totalPorts: number
    usedPorts: number
    availablePorts: number
    containerPorts: number
    systemPorts: number
    lastScan: string
}
