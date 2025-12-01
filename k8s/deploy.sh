#!/bin/bash

# Script para deploy do Grafana Agent com Faro no Kubernetes
# Autor: Auto-gerado
# Uso: ./deploy.sh [install|uninstall|status]

set -e

NAMESPACE="monitoring"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function check_prerequisites() {
    print_info "Verificando pré-requisitos..."

    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl não encontrado. Por favor, instale kubectl."
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        print_error "Não foi possível conectar ao cluster Kubernetes."
        exit 1
    fi

    print_info "Pré-requisitos OK!"
}

function create_namespace() {
    print_info "Criando namespace $NAMESPACE..."

    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_warn "Namespace $NAMESPACE já existe."
    else
        kubectl create namespace $NAMESPACE
        print_info "Namespace $NAMESPACE criado."
    fi
}

function install() {
    check_prerequisites
    create_namespace

    print_info "Fazendo deploy do Grafana Agent..."

    # Aplicar ConfigMap
    print_info "Aplicando ConfigMap..."
    kubectl apply -f grafana-agent-configmap.yaml

    # Aplicar Deployment e RBAC
    print_info "Aplicando Deployment e RBAC..."
    kubectl apply -f grafana-agent-deployment.yaml

    # Aplicar Service e Ingress
    print_info "Aplicando Service e Ingress..."
    kubectl apply -f grafana-agent-service.yaml

    print_info "Aguardando pods ficarem prontos..."
    kubectl wait --for=condition=ready pod -l app=grafana-agent -n $NAMESPACE --timeout=120s || {
        print_warn "Timeout aguardando pods. Verifique manualmente com: kubectl get pods -n $NAMESPACE"
    }

    print_info ""
    print_info "================================================"
    print_info "Deploy concluído com sucesso!"
    print_info "================================================"
    print_info ""
    print_info "Para verificar o status:"
    print_info "  kubectl get pods -n $NAMESPACE -l app=grafana-agent"
    print_info ""
    print_info "Para ver logs:"
    print_info "  kubectl logs -n $NAMESPACE -l app=grafana-agent -f"
    print_info ""
    print_info "Para fazer port-forward (teste local):"
    print_info "  kubectl port-forward -n $NAMESPACE svc/grafana-agent 12347:12347"
    print_info ""
    print_info "URL do Faro (interno):"
    print_info "  http://grafana-agent.$NAMESPACE.svc.cluster.local:12347/collect"
    print_info ""

    # Verificar se Ingress foi criado
    INGRESS_HOST=$(kubectl get ingress -n $NAMESPACE grafana-agent-faro -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    if [ -n "$INGRESS_HOST" ]; then
        print_info "URL do Faro (externo):"
        print_info "  https://$INGRESS_HOST/collect"
    else
        print_warn "Ingress não configurado. Configure o domínio em grafana-agent-service.yaml"
    fi
}

function uninstall() {
    print_warn "Removendo Grafana Agent..."

    kubectl delete -f grafana-agent-service.yaml --ignore-not-found=true
    kubectl delete -f grafana-agent-deployment.yaml --ignore-not-found=true
    kubectl delete -f grafana-agent-configmap.yaml --ignore-not-found=true

    print_info "Grafana Agent removido."
    print_warn "Namespace '$NAMESPACE' não foi removido. Para remover:"
    print_warn "  kubectl delete namespace $NAMESPACE"
}

function status() {
    print_info "Status do Grafana Agent:"
    print_info ""

    print_info "Pods:"
    kubectl get pods -n $NAMESPACE -l app=grafana-agent

    print_info ""
    print_info "Services:"
    kubectl get svc -n $NAMESPACE grafana-agent

    print_info ""
    print_info "Ingress:"
    kubectl get ingress -n $NAMESPACE grafana-agent-faro 2>/dev/null || print_warn "Ingress não encontrado"

    print_info ""
    print_info "Endpoints:"
    kubectl get endpoints -n $NAMESPACE grafana-agent
}

function usage() {
    echo "Uso: $0 [install|uninstall|status]"
    echo ""
    echo "Comandos:"
    echo "  install    - Instala o Grafana Agent no cluster"
    echo "  uninstall  - Remove o Grafana Agent do cluster"
    echo "  status     - Mostra o status do deployment"
    echo ""
    echo "Exemplos:"
    echo "  $0 install"
    echo "  $0 status"
    echo "  $0 uninstall"
}

# Main
case "$1" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    status)
        status
        ;;
    *)
        usage
        exit 1
        ;;
esac