"""config URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.generators import OpenAPISchemaGenerator
from drf_yasg.views import get_schema_view
from rest_framework.permissions import AllowAny


class BothHttpAndHttpsSchemaGenerator(OpenAPISchemaGenerator):
    def get_schema(self, request=None, public=False):
        schema = super().get_schema(request, public)
        schema.schemes = ["http", "https"]
        return schema


schema_view = get_schema_view(
    openapi.Info(
        title="User management APIs",
        default_version='v1',
    ),
    # url=settings.SWAGGER_URL,
    public=True,
    permission_classes=(AllowAny,),
    generator_class=BothHttpAndHttpsSchemaGenerator,
)


urlpatterns = \
    [
        path('admin/', admin.site.urls),
        path('api/', include('apps.account.urls')),
        path('api/', include('apps.report.urls')),
    ] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.SHOW_API_DOC:
    urlpatterns += [
        path('docs/', schema_view.with_ui('swagger', cache_timeout=0)),
        path('redocs/', schema_view.with_ui('redoc', cache_timeout=0))
    ]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
