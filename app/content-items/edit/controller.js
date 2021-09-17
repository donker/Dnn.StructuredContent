﻿app.controller('contentItemEditController', ['$scope', '$q', '$uibModalInstance', 'toastr', 'contentTypeService', 'contentItemService', 'contentFieldService', 'relationshipService', 'id', 'content_type_id', 'content_url_slug', function ($scope, $q, $uibModalInstance, toastr, contentTypeService, contentItemService, contentFieldService, relationshipService, id, content_type_id, content_url_slug) {

    $scope.loading = true;
    $scope.submitted = false;

    $scope.close = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.contentType = {
        id: content_type_id
    };
    $scope.contentItem = {
        id: id,
        content_type_id: content_type_id,
        status: "Draft"
    };
    $scope.contentFields = [];
    $scope.relationships = [];

    getContentType = function () {
        var deferred = $q.defer();
        $scope.loading = true;

        contentTypeService.get($scope.contentType.id).then(
            function (response) {
                $scope.contentType = response.data;

                $q.all([getContentFields(), getRelationships()]).then(
                    function () {
                        buildCanvas();
                        $scope.loading = false;
                        deferred.resolve();
                    },
                    function () {
                        $scope.loading = false;
                        deferred.resolve();
                    }
                );
            },
            function (response) {
                console.log('getContentType failed', response);
                $scope.loading = false;
                toastr.error("Error", "There was a problem loading the Content Type");
                deferred.reject();
            }
        );
        return deferred.promise;
    };
    getContentFields = function () {
        var deferred = $q.defer();
        $scope.loading = true;
        contentFieldService.search(content_url_slug, true).then(
            function (response) {
                $scope.contentFields = response.data;
                $scope.loading = false;
                deferred.resolve();
            },
            function (response) {
                console.log('getContentFields failed', response);
                toastr.error("Error", "There was a problem loading the Content Fields");
                $scope.loading = false;
                deferred.reject();
            }
        );
        return deferred.promise;
    };
    getRelationships = function () {
        var deferred = $q.defer();
        $scope.loading = true;
        relationshipService.search($scope.contentType.id, $scope.contentType.id).then(
            function (response) {
                $scope.relationships = response.data;
                $scope.loading = false;
                deferred.resolve();
            },
            function () {
                console.log('getRelationships failed', response);
                toastr.error("Error", "There was a problem loading the relationships");
                $scope.loading = false;
                deferred.reject();
            }
        );
        return deferred.promise;
    };

    $scope.saveDraft = function () {
        var deferred = $q.defer();
        $scope.saving = true;

        if ($scope.formContentItem.name.$valid) {

            $scope.contentItem.status = "Draft";
            $scope.contentItem.date_published = null;

            prepItemForSave();

            contentItemService.save(content_url_slug, $scope.contentItem).then(
                function (response) {
                    $scope.contentItem.id = response.data;
                    deferred.resolve();
                    $uibModalInstance.close($scope.contentItem);
                },
                function (response) {
                    console.log('save ContentItemDraft failed', response);
                    toastr.error("Error", "There was a problem saving the content item");
                    $scope.saving = false;
                    $scope.loading = false;
                    deferred.reject();
                }
            );
        }
        else {
            var field = $('#formContentItem').find('.ng-invalid:first');
            field.focus();
            toastr.error("Please complete this field.", "Error");
            $scope.saving = false;
            $scope.loading = false;
            deferred.reject();
        }

        return deferred.promise;
    };
    $scope.savePublish = function () {
        var deferred = $q.defer();
        $scope.saving = true;
        $scope.loading = true;
        $scope.submitted = true;

        if ($scope.formContentItem.$valid) {

            $scope.contentItem.status = "Published";

            prepItemForSave();

            contentItemService.save(content_url_slug, $scope.contentItem).then(
                function (response) {
                    $scope.contentItem.id = response.data; // in the case of an insert - need the id
                    deferred.resolve();
                    $uibModalInstance.close($scope.contentItem);
                },
                function (response) {
                    console.log('save ContentItemPublish failed', response);
                    toastr.error("Error", "There was a problem saving the content item");
                    $scope.saving = false;
                    $scope.loading = false;
                    deferred.reject();
                }
            );
        }
        else {
            // set the focus on first invalid field            
            var field = $('#formContentItem').find('.ng-invalid:first');
            field.focus();
            toastr.error("Please complete this field.", "Error");
            $scope.saving = false;
            $scope.loading = false;
            deferred.reject();
        }
        return deferred.promise;
    };

    saveRelationship = function (relationship) {
        var deferred = $q.defer();
        $scope.saving = true;
        $scope.loading = true;

        //console.log(relationship);

        //// prep relationships for save by sending back just the id of each related content item
        //var a_values = [];
        //if (relationship.a_value) {
        //    relationship.a_value.forEach(function (item) {
        //        a_values.push(item.id);
        //    });
        //}
        //relationship.a_value = a_values;      

        //var b_values = [];
        //if (relationship.b_value) {
        //    relationship.b_value.forEach(function (item) {
        //        b_values.push(item.id);
        //    });
        //}
        //relationship.b_value = b_values;        

        //relationshipService.save_relationship(relationship, $scope.contentItem.id, $scope.contentType.id).then(
        //    function (response) {
        //        $scope.saving = false;
        //        $scope.loading = false;
        //        deferred.resolve();
        //    },
        //    function (response) {
        //        console.log('save relationship failed', response);
        //        toastr.error("Error", "There was a problem saving the relationship");
        //        $scope.saving = false;
        //        $scope.loading = false;
        //        deferred.reject();
        //    }
        //);

        return deferred.promise;
    };

    getContentItem = function () {
        var deferred = $q.defer();
        $scope.loading = true;
        contentItemService.get(content_url_slug, $scope.contentItem.id).then(
            function (response) {
                $scope.contentItem = response.data;
                $scope.loading = false;
                deferred.resolve();
            },
            function (response) {
                console.log('getContentItem failed', response);
                toastr.error("Error", "There was a problem loading the Content Item");
                $scope.loading = false;
                deferred.reject();
            }
        );
        return deferred.promise;
    };

    prepItemFromLoad = function () {

        // move the values from the content_item object to the content_field collection for editing
        $scope.contentFields.forEach(function (content_field) {
            content_field.value = $scope.contentItem[content_field.column_name];
        });

        // for each relationship, determine the primary and related content types
        $scope.relationships.forEach(function (relationship) {

            if (relationship.key === 'o2m') {
                if ($scope.contentType.id === relationship.b_content_type_id) {
                    relationship.a_value = $scope.contentItem[relationship.a_column_name];
                }

                if ($scope.contentType.id === relationship.a_content_type_id) {
                    relationship.primary_content_type = relationship.a_content_type;
                    relationship.related_content_type = relationship.b_content_type;
                    relationship.related_items = $scope.contentItem[relationship.b_content_type.plural.toLowerCase()];
                    relationship.min_limit = relationship.b_min_limit;
                    relationship.max_limit = relationship.b_max_limit;
                    relationship.help_text = relationship.b_help_text;
                }
            }

            if (relationship.key === 'm2m') {
                if ($scope.contentType.id === relationship.a_content_type_id) {
                    relationship.primary_content_type = relationship.a_content_type;
                    relationship.related_content_type = relationship.b_content_type;
                    relationship.related_items = $scope.contentItem[relationship.b_content_type.plural.toLowerCase()];
                    relationship.min_limit = relationship.b_min_limit;
                    relationship.max_limit = relationship.b_max_limit;
                    relationship.help_text = relationship.b_help_text;
                }

                if ($scope.contentType.id === relationship.b_content_type_id) {
                    relationship.primary_content_type = relationship.b_content_type;
                    relationship.related_content_type = relationship.a_content_type;
                    relationship.related_items = $scope.contentItem[relationship.a_content_type.plural.toLowerCase()];
                    relationship.min_limit = relationship.a_min_limit;
                    relationship.max_limit = relationship.a_max_limit;
                    relationship.help_text = relationship.a_help_text;
                }
            }
        });
    };

    // move data from content_field editors into content_item
    prepItemForSave = function () {
        for (var indexField = 0; indexField < $scope.contentFields.length; indexField++) {
            var contentField = $scope.contentFields[indexField];

            if (!contentField.is_system) {
                $scope.contentItem[contentField.column_name] = contentField.value;
            }
        }
    };

    buildCanvas = function () {

        $scope.canvas = {
            rows: []
        };

        var notPlacedFields = []; // this can happen if the user closed the dialog without saving.
        var notPlacedRelationships = []; // this can happen if the user closed the dialog without saving.

        var maxRow = 0;
        var maxColumn = 0;

        // content fields
        $scope.contentFields.forEach(function (item) {
            if (item.is_system === false) {
                if (item.layout_row > maxRow) {
                    maxRow = item.layout_row;
                }
                if (item.layout_column > maxColumn) {
                    maxColumn = item.layout_column;
                }
            }
        });

        // relationships
        $scope.relationships.forEach(function (item) {
            if (item.layout_row > maxRow) {
                maxRow = item.layout_row;
            }
            if (item.layout_column > maxColumn) {
                maxColumn = item.layout_column;
            }
        });

        // create the rows and columns
        for (var indexMaxRow = 0; indexMaxRow <= maxRow; indexMaxRow++) {

            var newRow = {
                class: 'row',
                columns: []
            };
            $scope.canvas.rows.push(newRow);

            for (var indexMaxColumn = 0; indexMaxColumn <= maxColumn; indexMaxColumn++) {
                var newColumn = {
                    class: 'col',
                    data: null
                };
                newRow.columns.push(newColumn);
            }
        }


        // insert the content_fields
        $scope.contentFields.forEach(function (item) {
            if (item.is_system === false) {
                item._type = 'content_field';
                if ($scope.canvas.rows[item.layout_row] && $scope.canvas.rows[item.layout_row].columns[item.layout_column]) {
                    $scope.canvas.rows[item.layout_row].columns[item.layout_column].data = item;
                }
                else {
                    notPlacedFields.push(item);
                }
            }
        });

        // insert the relationships 
        $scope.relationships.forEach(function (item) {
            item._type = 'relationship';
            if ($scope.canvas.rows[item.layout_row] && $scope.canvas.rows[item.layout_row].columns[item.layout_column]) {
                $scope.canvas.rows[item.layout_row].columns[item.layout_column].data = item;
            }
            else {
                notPlacedRelationships.push(item);
            }
        });

        // clean up the emptys
        cleanUpEmptyRowsColumns()

        // place any non placed items
        notPlacedFields.forEach(function (item) {
            var newRow = {
                class: 'row',
                columns: [
                    {
                        class: 'col',
                        data: item
                    }
                ]
            };
            $scope.canvas.rows.push(newRow);
        });
        notPlacedRelationships.forEach(function (item) {
            var newRow = {
                class: 'row',
                columns: [
                    {
                        class: 'col',
                        data: item
                    }
                ]
            };
            $scope.canvas.rows.push(newRow);
        });
    };
    cleanUpEmptyRowsColumns = function () {

        // cleanup empty rows
        for (var indexRow = $scope.canvas.rows.length - 1; indexRow >= 0; indexRow--) {
            var row = $scope.canvas.rows[indexRow];

            // cleanup empty columns
            for (var indexColumn = row.columns.length - 1; indexColumn >= 0; indexColumn--) {
                var column = row.columns[indexColumn];
                if (!column.data) {
                    row.columns.splice(indexColumn, 1);
                }
            }

            if (row.columns.length === 0) {
                $scope.canvas.rows.splice(indexRow, 1);
            }
        }
    };

    init = function () {
        var promises = [];

        if ($scope.contentType.id) {
            promises.push(getContentType());
        }

        if ($scope.contentItem.id) {
            promises.push(getContentItem());
        }

        return $q.all(promises);
    };

    init().then(
        function () {
            prepItemFromLoad();
        }
    );

}]);

