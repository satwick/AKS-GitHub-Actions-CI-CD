# AKS GitHub Actions CI/CD

This repository contains Kubernetes manifest templates and a GitHub Actions workflow for deploying to Azure Kubernetes Service (AKS).

## Manifest files
- `deployment.yml` – Helm template for the main Deployment.
- `certsdeployment.yml` – Deployment variant that mounts certificate ConfigMaps.
- `service.yml` – ClusterIP service exposing the application.
- `ingress.yml` – Azure Application Gateway ingress configuration.
- `pdb.yml` – Optional PodDisruptionBudget for availability.
- `values.yml` – Default Helm values for namespace, replicas and resources.

## GitHub Actions workflow
The workflow defined in `.github/workflows/aks-cicd.yml` builds a Docker image, runs tests and deploys the manifests to AKS.

### Setup
1. Create an Azure service principal and add the JSON output as the `AZURE_CREDENTIALS` secret.
2. Provide `ACR_USERNAME`, `ACR_PASSWORD` and `ACR_NAME` so the workflow can push images to Azure Container Registry.
3. Set `AKS_CLUSTER`, `AKS_RESOURCE_GROUP` and `AKS_NAMESPACE` to point to your AKS environment.

Push changes to the `main` branch to trigger the pipeline and deploy to AKS.



# KUBERNETES
Kubernetes (K8s) is an open-source system for automating deployment, scaling, and management of containerized applications.

# HELM
Helm helps you manage Kubernetes applications — 

It renders our apps templates and communicates with the Kubernetes API
It runs on our Jenkins slave

Charts are Helm packages that contain at least two things:
   1) A description of the package (Chart.yaml) (kubernetes/helm/Charts)
   2) One or more templates, which contain Kubernetes manifest files (kubernetes/helm/charts/templates)
   
With Helm, configuration settings are kept separate from the manifest formats. You can edit the configuration values without changing the rest of the manifest. Configuration settings are in a values.yaml file (Kubernetes/helm/values/{ENV}/). You update the runtime parameters in that file to deploy each application instance differently.

In simple terms, helm is a package manager for kubernetes. Helm is kubernetes version of yum or apt. Helm deploys something called charts, which you can think of as a packaged application. 

# HELM CHARTS
It is a collection of all your versioned, pre configured application resources which can be deployed as one unit. You can then deploy another version of the chart with a different set of configuration.

The directory /kubernetes/helm/charts/templates, contains  multiple  manfiest files:

## 1. Deployment File: 

A Deployment provides declarative updates for Pods and ReplicaSets.

You describe a desired state in a Deployment, and the Deployment Controller changes the actual state to the desired state at a controlled rate. You can define Deployments to create new ReplicaSets, or to remove existing Deployments and adopt all their resources with new Deployments.

### POD affinity/anti-affinity
Pod affinity and pod anti-affinity allow you to specify rules about how pods should be placed relative to other pods. The rules are defined using custom labels on nodes and label selectors specified in pods. Pod affinity/anti-affinity allows a pod to specify an affinity (or anti-affinity) towards a group of pods it can be placed with. The node does not have control over the placement.
```ruby
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: name
                operator: In
                values:
```


### Security Context
A security context defines the operating system security settings (uid, gid, capabilities, SELinux role, etc..) applied to a container. Here we  are running container  with  a  specific UID (not with  root  access)
```ruby
    spec:
      securityContext:
        runAsUser: 1000
```


### SideCar 
In the  deployment file we have configured  two  containers, sideCar and business app. The  purpose of  side car  is to ship  the  application  logs from  business app  to  elastic search. The sideCar  deploys with image : reg-dhc.app.corpintra.net/vpp/vpp-lipf-java-seed:latest , it has  installed  binary of fluentBit i.e. td-agent-bit. Currently SideCar  contaier will  deploy only in  case of  INT env. To enable it for DEV and PROD, add the respective IF condition of ENV.
The  configuration of  fluentbit is set in td-agent-bit.conf file. Its manifest  file is kept here, /kubernetes/helm/charts/templates/lipf-fulent-bit-conf.yaml.
```ruby
      containers:
        {{ if eq .Values.Namespace "int" }}
        - name: sidecar-log-collector
          image: reg-dhc.app.corpintra.net/vpp/vpp-lipf-java-seed:latest
          volumeMounts:
          ....  
          - mountPath: /etc/td-agent-bit/td-agent-bit.conf
            name: config-fluent-bit
            subPath: td-agent-bit.conf
 ```


### Business Logic
The  business app is where the  actual logic of  the application executes. The PROD ENV deploys the app with INT image. Whereas DEV and INT ENV builds its own image.
```ruby
      containers:
          {{ if eq .Values.Namespace "prod" }}
          image: reg-dhc.app.corpintra.net/vpp/lipf-*****:latest-int
          {{ else }}
          image: reg-dhc.app.corpintra.net/vpp/lipf-******:latest-{{ .Values.Namespace }}
          {{- end }}
```


### ImagePull Secret
A Kubernetes cluster uses the Secret of docker-registry type to authenticate with a container registry to pull a private image. We have  Quay and  Harbor as our continer  registry in CaaS. It recommended to  keep  the  images  private by creating robot account in Quay.
```ruby
      imagePullSecrets:
        - name: vpp-lipf-pull-secret 
```
### Limit and Request
If the node where a Pod is running has enough of a resource available, it's possible (and allowed) for a container to use more resource than its request for that resource specifies. However, a container is not allowed to use more than its resource limit. The resources here mentioned are  CPU and Memory. The values of  these  resources are defined in  /kubernetes/helm/values/{ENV}/values.yaml. 
```ruby
          resources:
            requests:
              memory : {{ .Values.resources.requests.memory }}
              cpu : {{ .Values.resources.requests.cpu }}
            limits:
              memory : {{ .Values.resources.limits.memory }}
              cpu : {{ .Values.resources.limits.cpu }}
```
## 2. Ingress File: 
This file contains an API object that manages external access to the services in a k8s cluster, typically HTTP. We have  deployed Traefik as an Ingress controller in our CaaS  tenant.

Using the Ingress resource and the associated Ingress Controller we have achieved the following:
 - Domain : Point our domain lipf- {ENV}.app.corpintra.net to the microservice app in our CaaS private network and load balance between multiple instances (Pods) of that microservice..
 - Path : Point the path /<Path-name> to the microservice (which  needs to  be exposed from outside) in our CaaS private network.   
 - Backend: Backend includes the microservice (name of the  service) and the  port where it is listining.  
```ruby
   rules:
  {{ if eq .Values.Namespace "prod" }}
  - host: lipf.app.corpintra.net
  {{ else }}
  - host: lipf-{{ .Values.Namespace }}.app.corpintra.net
  {{ end }}
    http:
      paths:
      - backend:
          serviceName: <microservice service name>
          servicePort: <port>
        path: /<path>/
   ```

## 3. NetworkPolicy File: 
A network policy is a specification of how groups of pods are allowed to communicate with each other and other network endpoints. In our  CaaS  tenant the default network policy  is deny all, that  means, by defult pod to pod communication is denied. In many  cases pod need to  communicate  with  another pod (in same  namespace or different namespace), this communication can  be enabled by  writing  a  manifest file of type netwokPolicy.   
```ruby
spec:
  podSelector:
    matchLabels:
      app: vans-forecast
  ingress:
    - ports:
      - port: 8080
        protocol: TCP
    - from:
      {{- if ne .Values.Namespace "dev" }}
      - podSelector:
          matchLabels:
            app: i3-tex-caddy
      {{ else }}
      - namespaceSelector:
          matchLabels:
            name: ingress
      {{- end }}
```
taking the  above example, vans-forecast microservice applies an ingress traffic to the  selected  pods (If no policyTypes are specified on a NetworkPolicy then by default Ingress will always be set). Based on  the ENV (dev or int/prod), NetworkPolicy applies  which  pod  can communicate with vans-forecast micro-service.
In case, when  ENV is dev, van-forecast only allows incoming traffic from ingress controller pods which are in different namespace (ingress). 
In case of  int/prod, van-forecast only allows incoming traffic from  i3-tex-caddy pod on port 8080. I3-tex-caddy and  vans-forecast are in  same namespace. 

## 4. Pod Disruption Budget File: 
A pod disruption budget is an indicator of the number of disruptions that can be tolerated at a given time for a class of pods (a budget of faults). Whenever a disruption to the pods in a service is calculated to cause the service to drop below the budget, the operation is paused until it can maintain the budget. This means that the drain event could be temporarily halted while it waits for more pods to become available such that the budget isn’t crossed by evicting the pods.

Pod Disruption Budget is currently  set for  INT and  PROD env. In INT and PROD env we have  replicaCount for  each  microservices > 1. To deloy PDB for any micro-service, make sure the  replicaCount  for that  mirco-service should always be > 1 otherwise at patching node /upgarding node/draining node time, the node may stuck.

## 5. ConfigMap File:
ConfigMaps allow us to decouple configuration artifacts from image content to keep containerized applications portable.
In LIPF, we have configmap deployed for  postres and  fluent-bit. 

#### Troubleshooting:
#### 1) Pods are pending with event message failedScheduling

If the scheduler cannot find any node where a Pod can fit, the Pod remains unscheduled until a place can be found. An event is produced each time the scheduler fails to find a place for the Pod.
If a Pod is pending with a message of this type, there are several things to try:

1.1) Add more nodes to the cluster.

1.2) Terminate unneeded Pods to make room for pending Pods.

1.3) Check that the Pod is not larger than all the nodes. For example, if all the nodes have a capacity of cpu: 1, then a Pod with a request of cpu: 1.1 will never be scheduled.

#### 2) Container is terminated
Container might get terminated because it is resource-starved. To check whether a Container is being killed because it is hitting a resource limit, call kubectl describe pod on the Pod of interest or check  grafan dashboard of  Pod.  One  reason  of its  termination could be  reason: OOM Killed, where OOM stands for  Out Of Memory.  
