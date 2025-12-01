#!/bin/bash

# Script para descobrir endpoints do Loki, Tempo e Prometheus no cluster
# Autor: Auto-gerado
# Uso: ./discover-endpoints.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  Descobrindo Endpoints no Cluster${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl não encontrado. Por favor, instale kubectl.${NC}"
    exit 1
fi

echo -e "${GREEN}Procurando por Loki...${NC}"
echo "Services:"
kubectl get svc --all-namespaces -o wide | grep -i loki || echo "  Nenhum serviço Loki encontrado"
echo ""

echo -e "${GREEN}Procurando por Tempo...${NC}"
echo "Services:"
kubectl get svc --all-namespaces -o wide | grep -i tempo || echo "  Nenhum serviço Tempo encontrado"
echo ""

echo -e "${GREEN}Procurando por Prometheus...${NC}"
echo "Services:"
kubectl get svc --all-namespaces -o wide | grep -i prometheus || echo "  Nenhum serviço Prometheus encontrado"
echo ""

echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}Sugestões de Configuração:${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Tentar encontrar Loki
LOKI_SVC=$(kubectl get svc --all-namespaces -o json | jq -r '.items[] | select(.metadata.name | test("loki")) | "\(.metadata.namespace)/\(.metadata.name):\(.spec.ports[0].port)"' | head -1)
if [ -n "$LOKI_SVC" ]; then
    LOKI_NS=$(echo $LOKI_SVC | cut -d'/' -f1)
    LOKI_NAME=$(echo $LOKI_SVC | cut -d'/' -f2 | cut -d':' -f1)
    LOKI_PORT=$(echo $LOKI_SVC | cut -d':' -f2)
    echo -e "${GREEN}Loki encontrado:${NC}"
    echo "  URL: http://${LOKI_NAME}.${LOKI_NS}.svc.cluster.local:${LOKI_PORT}/loki/api/v1/push"
    echo ""
fi

# Tentar encontrar Tempo
TEMPO_SVC=$(kubectl get svc --all-namespaces -o json | jq -r '.items[] | select(.metadata.name | test("tempo")) | "\(.metadata.namespace)/\(.metadata.name):\(.spec.ports[] | select(.name == "otlp-grpc" or .name == "grpc" or .port == 4317) | .port)"' | head -1)
if [ -n "$TEMPO_SVC" ]; then
    TEMPO_NS=$(echo $TEMPO_SVC | cut -d'/' -f1)
    TEMPO_NAME=$(echo $TEMPO_SVC | cut -d'/' -f2 | cut -d':' -f1)
    TEMPO_PORT=$(echo $TEMPO_SVC | cut -d':' -f2)
    echo -e "${GREEN}Tempo encontrado:${NC}"
    echo "  URL: http://${TEMPO_NAME}.${TEMPO_NS}.svc.cluster.local:${TEMPO_PORT}"
    echo ""
fi

# Tentar encontrar Prometheus
PROM_SVC=$(kubectl get svc --all-namespaces -o json | jq -r '.items[] | select(.metadata.name | test("prometheus")) | "\(.metadata.namespace)/\(.metadata.name):\(.spec.ports[0].port)"' | head -1)
if [ -n "$PROM_SVC" ]; then
    PROM_NS=$(echo $PROM_SVC | cut -d'/' -f1)
    PROM_NAME=$(echo $PROM_SVC | cut -d'/' -f2 | cut -d':' -f1)
    PROM_PORT=$(echo $PROM_SVC | cut -d':' -f2)
    echo -e "${GREEN}Prometheus encontrado:${NC}"
    echo "  URL: http://${PROM_NAME}.${PROM_NS}.svc.cluster.local:${PROM_PORT}/api/v1/write"
    echo ""
fi

echo -e "${BLUE}==========================================${NC}"
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "1. Verifique se as portas estão corretas"
echo "2. Prometheus pode precisar de remote_write habilitado"
echo "3. Use estes endpoints no arquivo grafana-agent-configmap.yaml"
echo -e "${BLUE}==========================================${NC}"