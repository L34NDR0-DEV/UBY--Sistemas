// MapModal.js - Gerenciamento independente do modal de mapas
class MapModal {
    constructor() {
        this.map = null;
        this.currentCoordinates = null;
        this.isInitialized = false;
        this.init();
    }

    // Inicializar o modal
    init() {
        console.log('=== INÍCIO MapModal.init ===');
        
        // Verificar se o Leaflet está disponível
        if (typeof L === 'undefined') {
            console.error('Leaflet não está carregado');
            setTimeout(() => {
                if (typeof L !== 'undefined') {
                    this.isInitialized = true;
                    console.log('MapModal inicializado com sucesso após delay');
                } else {
                    console.error('Leaflet ainda não está disponível após delay');
                }
            }, 1000);
            return false;
        }

        this.isInitialized = true;
        console.log('MapModal inicializado com sucesso');
        return true;
    }

    // Abrir modal de localização
    open(coordinates, clienteNome = null) {
        console.log('=== INÍCIO MapModal.open ===');
        console.log('Coordenadas recebidas:', coordinates);
        console.log('Nome do cliente:', clienteNome);

        // Verificar se o Leaflet está disponível
        if (typeof L === 'undefined') {
            console.error('Leaflet não está carregado');
            if (typeof showToast === 'function') {
                showToast('Erro: Biblioteca de mapa não disponível', 'error');
            }
            return;
        }

        if (!this.isInitialized) {
            if (!this.init()) {
                if (typeof showToast === 'function') {
                    showToast('Erro: Biblioteca de mapa não disponível', 'error');
                }
                return;
            }
        }

        // Verificar se as coordenadas estão presentes
        if (!coordinates || typeof coordinates !== 'string') {
            if (typeof showToast === 'function') {
                showToast('Coordenadas não fornecidas', 'error');
            }
            return;
        }

        // Parsear coordenadas
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        if (isNaN(lat) || isNaN(lng)) {
            if (typeof showToast === 'function') {
                showToast('Coordenadas inválidas', 'error');
            }
            return;
        }

        const modal = document.getElementById('locationModal');
        const coordinatesSpan = document.getElementById('currentCoordinates');
        const citySpan = document.getElementById('currentCity');
        
        if (!modal || !coordinatesSpan || !citySpan) {
            if (typeof showToast === 'function') {
                showToast('Erro ao abrir o modal de localização', 'error');
            }
            return;
        }

        // Atualizar informações no modal
        coordinatesSpan.textContent = `${lat},${lng}`;
        citySpan.textContent = 'Carregando...';
        modal.classList.add('show');

        // Buscar nome da cidade
        this.fetchCityName(lat, lng).then(cityName => {
            console.log('Nome da cidade obtido:', cityName);
            citySpan.textContent = cityName;
        }).catch(error => {
            console.error('Erro ao buscar nome da cidade:', error);
            citySpan.textContent = 'Localização desconhecida';
        });

        // Armazenar nome do cliente
        this.currentClienteNome = clienteNome;
        
        // Inicializar mapa
        this.initializeMap(`${lat},${lng}`);

        console.log('=== FIM MapModal.open ===');
    }

    // Fechar modal de localização
    close() {
        console.log('=== INÍCIO MapModal.close ===');
        
        const modal = document.getElementById('locationModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // Destruir o mapa
        if (this.map) {
            try {
                this.map.remove();
            } catch (error) {
                console.warn('Erro ao remover mapa:', error);
            }
            this.map = null;
            this.currentCoordinates = null;
        }
        
        console.log('=== FIM MapModal.close ===');
    }

    // Inicializar mapa
    initializeMap(coordinates) {
        console.log('=== INÍCIO MapModal.initializeMap ===');
        console.log('Coordenadas recebidas:', coordinates);
        
        // Destruir mapa existente se houver
        if (this.map) {
            try {
                this.map.remove();
            } catch (error) {
                console.warn('Erro ao remover mapa existente:', error);
            }
            this.map = null;
        }
        
        // Parsear coordenadas
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        
        if (isNaN(lat) || isNaN(lng)) {
            console.error('Coordenadas inválidas:', coordinates);
            if (typeof showToast === 'function') {
                showToast('Coordenadas inválidas', 'error');
            }
            return;
        }
        
        this.currentCoordinates = [lat, lng];
        
        // Verificar se o elemento do mapa existe
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Elemento do mapa não encontrado');
            if (typeof showToast === 'function') {
                showToast('Erro: Elemento do mapa não encontrado', 'error');
            }
            return;
        }
        
        // Limpar o elemento do mapa
        mapElement.innerHTML = '';
        
        // Mostrar controles de zoom
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const centerMapBtn = document.getElementById('centerMap');
        
        if (zoomInBtn) zoomInBtn.style.display = 'block';
        if (zoomOutBtn) zoomOutBtn.style.display = 'block';
        if (centerMapBtn) centerMapBtn.style.display = 'block';
        
        try {
            // Inicializar mapa
            console.log('Inicializando mapa...');
            
            // Verificar se o elemento do mapa tem dimensões
            const mapElement = document.getElementById('map');
            console.log('Dimensões do elemento do mapa:', {
                width: mapElement.offsetWidth,
                height: mapElement.offsetHeight,
                style: mapElement.style.cssText
            });
            
            // Garantir que o elemento do mapa tenha dimensões mínimas
            if (mapElement.offsetWidth < 100 || mapElement.offsetHeight < 100) {
                mapElement.style.width = '100%';
                mapElement.style.height = '400px';
                console.log('Dimensões do mapa ajustadas');
            }
            
            this.map = L.map('map', {
                zoomControl: false,
                attributionControl: false,
                preferCanvas: true
            }).setView([lat, lng], 16);
            
            console.log('Mapa inicializado com sucesso');
            
                         // Carregar tiles do mapa
             this.loadMapTiles();
             
             // Aguardar um pouco para garantir que o mapa esteja pronto
             setTimeout(() => {
                 // Criar marcador
                 this.createMarker(lat, lng);
             }, 500);
            
            console.log('=== FIM MapModal.initializeMap (SUCESSO) ===');
            
        } catch (error) {
            console.error('Erro ao inicializar mapa:', error);
            if (typeof showToast === 'function') {
                showToast('Erro ao carregar mapa', 'error');
            }
        }
    }

    // Carregar tiles do mapa
    loadMapTiles() {
        console.log('Carregando tiles do mapa...');
        console.log('Leaflet disponível:', typeof L !== 'undefined');
        console.log('Mapa disponível:', this.map);
        
        // Lista de provedores de tiles para tentar
        const providers = [
            {
                name: 'OpenStreetMap',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                subdomains: ['a', 'b', 'c']
            },
            {
                name: 'CartoDB',
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                attribution: '© CartoDB',
                subdomains: ['a', 'b', 'c', 'd']
            },
            {
                name: 'Esri',
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                attribution: '© Esri'
            }
        ];

        let tileLoaded = false;
        let currentProviderIndex = 0;

        const tryNextProvider = () => {
            if (currentProviderIndex >= providers.length) {
                console.error('Todos os provedores falharam, criando mapa offline');
                this.createOfflineMap();
                return;
            }

            const provider = providers[currentProviderIndex];
            console.log(`Tentando provedor: ${provider.name} com URL: ${provider.url}`);

            try {
                const tileLayer = L.tileLayer(provider.url, {
                    attribution: provider.attribution,
                    maxZoom: 18,
                    subdomains: provider.subdomains || ['a', 'b', 'c']
                });

                console.log('TileLayer criado:', tileLayer);
                tileLayer.addTo(this.map);
                tileLoaded = true;
                console.log(`${provider.name} carregado com sucesso`);

                // Verificar se realmente carregou após um delay
                setTimeout(() => {
                    console.log('Verificando se tiles carregaram...');
                    if (!this.checkTilesLoaded()) {
                        console.warn(`${provider.name} não carregou corretamente, tentando próximo`);
                        this.map.removeLayer(tileLayer);
                        tileLoaded = false;
                        currentProviderIndex++;
                        tryNextProvider();
                    } else {
                        console.log(`${provider.name} carregou com sucesso!`);
                    }
                }, 3000);

            } catch (error) {
                console.error(`Erro ao carregar ${provider.name}:`, error);
                currentProviderIndex++;
                tryNextProvider();
            }
        };

        // Iniciar tentativas
        tryNextProvider();
    }

    // Verificar se os tiles carregaram
    checkTilesLoaded() {
        if (!this.map || !this.map._layers) {
            console.log('Mapa ou layers não disponíveis');
            return false;
        }
        
        const layers = Object.values(this.map._layers);
        console.log('Layers encontradas:', layers.length);
        
        const hasTileLayer = layers.some(layer => {
            const hasUrl = layer._url && (layer._url.includes('tile') || layer._url.includes('arcgis'));
            console.log('Layer URL:', layer._url, 'Has URL:', hasUrl);
            return hasUrl;
        });
        
        console.log('Verificação de tiles:', hasTileLayer);
        return hasTileLayer;
    }

    // Criar marcador
    createMarker(lat, lng) {
        console.log('Criando marcador...');
        
        try {
            // Criar ícone personalizado usando a imagem ping.png
            const customIcon = L.icon({
                iconUrl: '../assets/ping.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
                className: 'custom-marker-icon'
            });
            
            // Criar marcador com ícone personalizado
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
            
            // Adicionar popup com informações detalhadas
            const popupContent = `
                <div style="
                    font-family: 'Segoe UI', sans-serif;
                    padding: 8px;
                    text-align: center;
                ">
                    <div style="
                        color: #FF6B00;
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 8px;
                    ">
                        📍 ${this.currentClienteNome || 'Localização'}
                    </div>
                    <div style="
                        font-size: 12px;
                        color: #666;
                        line-height: 1.4;
                    ">
                        <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
                        <strong>Longitude:</strong> ${lng.toFixed(6)}
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            
            // Abrir popup automaticamente após um delay
            setTimeout(() => {
                try {
                    marker.openPopup();
                    console.log('Popup aberto automaticamente');
                } catch (error) {
                    console.warn('Erro ao abrir popup:', error);
                }
            }, 1500);
            
            // Centralizar o mapa no marcador
            this.map.setView([lat, lng], 16);
            
            console.log('Marcador criado com sucesso');
            
        } catch (error) {
            console.error('Erro ao criar marcador:', error);
            
            // Fallback: criar marcador simples se o personalizado falhar
            try {
                const fallbackMarker = L.marker([lat, lng]).addTo(this.map);
                fallbackMarker.bindPopup(`<strong>Localização</strong><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
                console.log('Marcador de fallback criado');
            } catch (fallbackError) {
                console.error('Erro ao criar marcador de fallback:', fallbackError);
            }
        }
    }

    // Criar mapa offline quando tiles não carregam
    createOfflineMap() {
        console.log('Criando mapa offline...');
        
        const mapElement = document.getElementById('map');
        if (mapElement) {
            // Adicionar fundo visual
            mapElement.style.background = 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)';
            mapElement.style.backgroundSize = '20px 20px';
            mapElement.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
            
            // Adicionar mensagem
            const message = document.createElement('div');
            message.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 107, 0, 0.95);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                z-index: 1000;
                font-family: 'Segoe UI', sans-serif;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                max-width: 300px;
            `;
            message.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16V12"></path>
                        <path d="M12 8H12.01"></path>
                    </svg>
                </div>
                <strong style="font-size: 16px;">Mapa Offline</strong><br>
                <small style="opacity: 0.9;">Sem conexão com a internet</small><br><br>
                <small style="opacity: 0.8;">Coordenadas: ${this.currentCoordinates ? this.currentCoordinates.join(', ') : 'N/A'}</small>
            `;
            mapElement.appendChild(message);
            
            console.log('Mapa offline criado com sucesso');
        }
    }

    // Buscar nome da cidade usando reverse geocoding
    async fetchCityName(lat, lng) {
        console.log('=== INÍCIO MapModal.fetchCityName ===');
        console.log('Coordenadas para busca:', { lat, lng });
        
        try {
            // Primeira tentativa: Nominatim (OpenStreetMap)
            console.log('Tentando Nominatim...');
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=pt-BR`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Resposta Nominatim:', data);
            
            if (data.address) {
                // Priorizar cidade, depois município, depois localidade
                const cityName = data.address.city || 
                               data.address.town || 
                               data.address.municipality || 
                               data.address.locality || 
                               data.address.village ||
                               data.address.county ||
                               data.address.state ||
                               'Localização desconhecida';
                
                console.log('Nome da cidade encontrado:', cityName);
                return cityName;
            }
            
            // Se não encontrou endereço, tentar usar display_name
            if (data.display_name) {
                const parts = data.display_name.split(', ');
                const cityName = parts[1] || parts[0] || 'Localização desconhecida';
                console.log('Usando display_name:', cityName);
                return cityName;
            }
            
            console.log('Nenhum nome de cidade encontrado');
            return 'Localização desconhecida';
            
        } catch (error) {
            console.error('Erro na busca de cidade (Nominatim):', error);
            
            // Fallback final: coordenadas formatadas
            const cityName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            console.log('Usando coordenadas como fallback:', cityName);
            return cityName;
        }
    }

    // Abrir no OpenStreetMap
    openInOpenStreetMap() {
        const coordinates = document.getElementById('currentCoordinates').textContent;
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
            try {
                if (typeof require !== 'undefined' && require('electron')) {
                    require('electron').shell.openExternal(openStreetMapUrl);
                } else {
                    window.open(openStreetMapUrl, '_blank');
                }
            } catch (error) {
                console.error('Erro ao abrir mapa externo:', error);
                window.open(openStreetMapUrl, '_blank');
            }
        } else {
            if (typeof showToast === 'function') {
                showToast('Coordenadas inválidas', 'error');
            }
        }
    }
}

// Criar instância global
let mapModalInstance = null;

// Funções globais para compatibilidade
window.openLocationModal = function(coordinates, clienteNome) {
    console.log('openLocationModal chamada com coordenadas:', coordinates);
    console.log('Nome do cliente:', clienteNome);
    if (!mapModalInstance) {
        mapModalInstance = new MapModal();
    }
    mapModalInstance.open(coordinates, clienteNome);
};

window.closeLocationModal = function() {
    if (mapModalInstance) {
        mapModalInstance.close();
    }
};

window.openInOpenStreetMap = function() {
    if (mapModalInstance) {
        mapModalInstance.openInOpenStreetMap();
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar estilos CSS para o modal e mapa
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para o modal de localização */
        #locationModal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
        }

        #locationModal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow: hidden;
            position: relative;
        }

        .modal-header {
            background: linear-gradient(135deg, #FF6B00, #FF8533);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }

        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.3s;
        }

        .close-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
            padding: 0;
            position: relative;
        }

        #map {
            width: 100%;
            height: 400px;
            background: #f5f5f5;
            border-radius: 0;
        }

        .map-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .map-control-btn {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .map-control-btn:hover {
            background: #f8f8f8;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .modal-footer {
            background: #f8f9fa;
            padding: 15px 20px;
            border-top: 1px solid #e9ecef;
        }

        .location-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .location-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #666;
        }

        .location-item i {
            color: #FF6B00;
            width: 16px;
        }

        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .action-btn {
            background: #FF6B00;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.3s;
            flex: 1;
        }

        .action-btn:hover {
            background: #e55a00;
        }

        .action-btn.secondary {
            background: #6c757d;
        }

        .action-btn.secondary:hover {
            background: #5a6268;
        }

                 /* Estilos para o marcador personalizado */
         .custom-marker-icon {
             background: transparent !important;
             border: none !important;
         }
         
         .custom-marker-icon img {
             width: 32px !important;
             height: 32px !important;
             filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) !important;
         }
         
         /* Garantir que o marcador seja sempre visível */
         .leaflet-marker-icon {
             z-index: 1000 !important;
         }
         
         .leaflet-marker-shadow {
             display: none !important;
         }
        
        .leaflet-popup-content {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .leaflet-popup-content strong {
            color: #FF6B00;
        }

        /* Responsividade */
        @media (max-width: 768px) {
            .modal-content {
                width: 95%;
                max-height: 90vh;
            }

            #map {
                height: 300px;
            }

            .modal-header {
                padding: 15px;
            }

            .modal-header h2 {
                font-size: 16px;
            }

            .action-buttons {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
    
    mapModalInstance = new MapModal();
    console.log('MapModal carregado com sucesso');
    
    // Configurar event listeners para os controles do mapa
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const centerMapBtn = document.getElementById('centerMap');
    const closeLocationModalBtn = document.getElementById('closeLocationModal');
    const openInMapsBtn = document.getElementById('openInMaps');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (mapModalInstance && mapModalInstance.map) {
                mapModalInstance.map.zoomIn();
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (mapModalInstance && mapModalInstance.map) {
                mapModalInstance.map.zoomOut();
            }
        });
    }
    
    if (centerMapBtn) {
        centerMapBtn.addEventListener('click', () => {
            if (mapModalInstance && mapModalInstance.map && mapModalInstance.currentCoordinates) {
                mapModalInstance.map.setView(mapModalInstance.currentCoordinates, 15);
            }
        });
    }
    
    if (closeLocationModalBtn) {
        closeLocationModalBtn.addEventListener('click', () => {
            if (mapModalInstance) {
                mapModalInstance.close();
            }
        });
    }
    
    if (openInMapsBtn) {
        openInMapsBtn.addEventListener('click', () => {
            if (mapModalInstance) {
                mapModalInstance.openInOpenStreetMap();
            }
        });
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapModal;
}
