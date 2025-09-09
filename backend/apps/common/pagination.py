from math import ceil
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class BYSSPagination(PageNumberPagination):
    page_query_param = "page"
    page_size_query_param = "page_size"
    # 兼容前端 pageSize
    def get_page_size(self, request):
        size = request.query_params.get("pageSize")
        if size:
            try:
                return min(int(size), self.max_page_size)
            except Exception:
                pass
        return super().get_page_size(request)
    max_page_size = 200

    def get_paginated_response(self, data):
        assert self.page is not None
        total_count = self.page.paginator.count
        page_size = self.get_page_size(self.request) or len(data)
        total_pages = ceil(total_count / page_size) if page_size else 0
        return Response(
            {
                "success": True,
                "data": {
                    "results": data,
                    "pagination": {
                        "page": self.page.number,
                        "page_size": page_size,
                        "total_pages": total_pages,
                        "total_count": total_count,
                    },
                },
                "message": "操作成功",
                "timestamp": timezone.now().isoformat(),
            }
        )


